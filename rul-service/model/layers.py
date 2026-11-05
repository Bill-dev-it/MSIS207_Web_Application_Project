"""
Core neural network layers for Condition-Aware iTransformer RUL prediction.
Faithfully preserved from the original research codebase (proposed_model/itransformer.py and proposed_model/audit_v2_models.py).
"""

import tensorflow as tf
from tensorflow import keras
from keras import layers


@keras.utils.register_keras_serializable(package="AeroRUL")
class SensorProjection(layers.Layer):
    """Project each sensor's temporal vector (length T=30) to d_model (32)."""

    def __init__(self, d_model: int = 32, **kwargs):
        super().__init__(**kwargs)
        self.d_model = d_model

    def build(self, input_shape):
        # input_shape: (B, C, T) -> (B, 14, 30)
        T = input_shape[-1]
        self.proj = self.add_weight(
            name="temporal_proj",
            shape=(T, self.d_model),
            initializer="glorot_uniform",
            trainable=True,
        )
        self.bias = self.add_weight(
            name="temporal_bias",
            shape=(self.d_model,),
            initializer="zeros",
            trainable=True,
        )
        super().build(input_shape)

    def call(self, x):
        # x: (B, C, T) -> tf.matmul -> (B, C, d_model)
        return tf.matmul(x, self.proj) + self.bias

    def get_config(self):
        config = super().get_config()
        config.update({"d_model": self.d_model})
        return config


@keras.utils.register_keras_serializable(package="AeroRUL")
class SensorIdentityEmbedding(layers.Layer):
    """
    Learnable sensor-identity embedding layer.
    Adds unique variate/sensor positional embedding to each of the 14 sensor tokens.
    """

    def __init__(self, n_sensors: int = 14, d_model: int = 32, **kwargs):
        super().__init__(**kwargs)
        self.n_sensors = n_sensors
        self.d_model = d_model

    def build(self, input_shape):
        self.sensor_embedding = self.add_weight(
            name="sensor_embedding",
            shape=(self.n_sensors, self.d_model),
            initializer="glorot_uniform",
            trainable=True,
        )
        super().build(input_shape)

    def call(self, inputs):
        # inputs shape: (B, C, d_model)
        # self.sensor_embedding shape: (C, d_model)
        return inputs + self.sensor_embedding

    def get_config(self):
        config = super().get_config()
        config.update({
            "n_sensors": self.n_sensors,
            "d_model": self.d_model,
        })
        return config


@keras.utils.register_keras_serializable(package="AeroRUL")
class TransformerEncoderBlock(layers.Layer):
    """
    Standard Transformer encoder block with Pre-LayerNorm:
    LayerNorm -> MultiHeadAttention (variate cross-sensor attention) -> Residual ->
    LayerNorm -> Feed-Forward Network (GELU) -> Residual.
    """

    def __init__(self, d_model: int = 32, n_heads: int = 2, ff_dim: int = 64,
                 dropout: float = 0.2, **kwargs):
        super().__init__(**kwargs)
        self.d_model = d_model
        self.n_heads = n_heads
        self.ff_dim = ff_dim
        self.dropout_rate = dropout

        self.ln1 = layers.LayerNormalization(epsilon=1e-6, name="ln1")
        self.mha = layers.MultiHeadAttention(
            num_heads=n_heads, key_dim=d_model // n_heads, dropout=dropout, name="mha"
        )
        self.drop1 = layers.Dropout(dropout, name="drop1")

        self.ln2 = layers.LayerNormalization(epsilon=1e-6, name="ln2")
        self.ffn = keras.Sequential([
            layers.Dense(ff_dim, activation="gelu", name="ffn_dense1"),
            layers.Dropout(dropout, name="ffn_drop1"),
            layers.Dense(d_model, name="ffn_dense2"),
            layers.Dropout(dropout, name="ffn_drop2"),
        ], name="ffn")

    def call(self, x, training=None):
        # Pre-norm Multi-Head Attention
        x_norm = self.ln1(x)
        attn_out = self.mha(x_norm, x_norm, training=training)
        x = x + self.drop1(attn_out, training=training)
        # Pre-norm FFN
        x_norm = self.ln2(x)
        ffn_out = self.ffn(x_norm, training=training)
        x = x + ffn_out
        return x

    def get_config(self):
        config = super().get_config()
        config.update({
            "d_model": self.d_model,
            "n_heads": self.n_heads,
            "ff_dim": self.ff_dim,
            "dropout": self.dropout_rate,
        })
        return config
