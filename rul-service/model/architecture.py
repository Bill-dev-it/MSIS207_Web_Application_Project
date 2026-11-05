"""
Condition-Aware iTransformer Model Architecture for Turbofan RUL Prediction.
Faithfully preserved from proposed_model/condition_token_pc_v3/model_condition_token.py.

Architecture summary:
- Inverted Tokenization: 14 sensor signals of length W=30 cycles -> 14 tokens in R^32.
- Sensor Identity Embedding: Adds learnable per-sensor identity representation.
- Condition Token: 30-cycle flight regime history (30 x 6) -> Flatten -> Dense(32, GELU) -> Dense(32) -> 1 token in R^32.
- Cross-Sensor Attention: [14 sensor tokens, 1 condition token] (15 tokens) -> Transformer Encoder.
- Condition Drop: Condition token is cropped out before regression head, ensuring the token acts purely via attention routing.
- Regression Head: Flatten(448) -> Dense(32, ReLU) -> Dropout(0.2) -> Dense(1, Linear) -> Predicted RUL.
"""

from tensorflow import keras
from keras import layers, Model

from .layers import SensorProjection, SensorIdentityEmbedding, TransformerEncoderBlock

# Default Hyperparameters
WINDOW_SIZE = 30
N_SENSORS = 14
N_REGIMES = 6
D_MODEL = 32
N_HEADS = 2
N_LAYERS = 1
FF_DIM = 64
DROPOUT = 0.2
DENSE_UNITS = 32


def build_condition_token_itransformer(
    window_size: int = WINDOW_SIZE,
    n_sensors: int = N_SENSORS,
    n_regimes: int = N_REGIMES,
    d_model: int = D_MODEL,
    n_heads: int = N_HEADS,
    n_layers: int = N_LAYERS,
    ff_dim: int = FF_DIM,
    dropout: float = DROPOUT,
    dense_units: int = DENSE_UNITS,
) -> Model:
    """Builds and returns the uncompiled Keras Model for Condition-Aware iTransformer."""

    sensor_in = keras.Input(shape=(window_size, n_sensors), name="sensor_input")
    cond_in = keras.Input(shape=(window_size, n_regimes), name="condition_input")

    # Sensor stream: (B, 30, 14) -> Permute -> (B, 14, 30) -> Project -> (B, 14, 32)
    s = layers.Permute((2, 1), name="invert_sensors")(sensor_in)
    s = SensorProjection(d_model=d_model, name="sensor_projection")(s)
    s = SensorIdentityEmbedding(n_sensors=n_sensors, d_model=d_model, name="sensor_identity")(s)

    # Condition stream: (B, 30, 6) -> Flatten(180) -> Dense(32, GELU) -> Dense(32) -> (B, 1, 32)
    c = layers.Flatten(name="cond_flatten")(cond_in)
    c = layers.Dense(d_model, activation="gelu", name="cond_dense_1")(c)
    c = layers.Dense(d_model, name="cond_token_proj")(c)
    c = layers.Reshape((1, d_model), name="cond_token")(c)

    # Joint token sequence: 14 sensors + 1 condition = 15 tokens
    tokens = layers.Concatenate(axis=1, name="sensor_plus_cond_tokens")([s, c])
    x = layers.Dropout(dropout, name="token_dropout")(tokens)

    # Transformer Encoder Block(s)
    for i in range(n_layers):
        x = TransformerEncoderBlock(
            d_model=d_model, n_heads=n_heads, ff_dim=ff_dim, dropout=dropout, name=f"enc_{i}"
        )(x)

    # Drop condition token, keep only 14 sensor tokens
    x = layers.Cropping1D(cropping=(0, 1), name="drop_cond_token")(x)
    x = layers.Flatten(name="flatten_sensor_tokens")(x)

    # RUL Regression Head
    x = layers.Dense(dense_units, activation="relu", name="head_dense")(x)
    x = layers.Dropout(dropout, name="head_dropout")(x)
    y = layers.Dense(1, activation="linear", name="rul_pred")(x)

    return Model(inputs=[sensor_in, cond_in], outputs=y, name="condition_token_itransformer")
