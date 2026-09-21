# Data pipeline

Bronze giữ dataset gốc. Silver chứa dữ liệu đã chuẩn hóa. Gold là một bộ
application seed duy nhất cho website, kết hợp reference FAA/parts với dữ
liệu synthetic cần thiết cho marketplace. Không tách Gold thành hai bộ
reference/demo vì toàn bộ Gold sẽ được import cùng nhau vào PostgreSQL lần
đầu.

Chạy từ thư mục gốc workspace:

```text
python scripts/bronze_to_silver/clean.py
python scripts/silver_to_gold/build_gold.py
python scripts/silver_to_gold/build_gold.py --check
```

Code dùng Python standard library. Kết quả và số lượng in trực tiếp ra terminal, không tạo folder báo cáo.

## Nguồn và dữ liệu demo

- `bronze/faa/faa_registry`: FAA ENGINE, ACFTREF và MASTER; giữ nguyên file gốc.
- `bronze/aviation_parts/parts_master`: nguồn mã parts, part family, cost và lead time.
- Các bộ ecommerce/supply-chain khác vẫn giữ ở bronze để tham khảo, không bắt buộc dùng hết.
- `silver/engines/engine_models.csv`: gộp theo manufacturer/model; giữ mọi source code và type code của nhóm. Mã loại vẫn dùng nhãn FAA_TYPE, chưa diễn giải sang tên loại.
- `silver/aircraft/aircraft.csv`: nối aircraft registry với model; không lấy tên/địa chỉ chủ đăng ký vào dataset ứng dụng.
- `silver/products/parts.csv`: chuẩn hóa mã, nhóm và số liệu parts.
- `silver/suppliers/suppliers.csv`: các supplier ID nguồn xuất hiện trong parts; chưa phải danh tính doanh nghiệp thật.
- Gold company/supplier/address, mã đăng ký aircraft, engine serial/cycle, tên và mã linh kiện, giá/stock/condition, compatibility là dữ liệu custom có seed cố định 42. Không cần coi chúng là bản ghi thật để demo app.
- Manufacturer/model FAA được giữ làm reference; fleet demo dùng registration DEMO và serial DEMO. Tên model aircraft/engine lấy từ quan hệ mã FAA có sẵn.
- Giá bán linh kiện dùng quy tắc demo cost × 1.65 × hệ số condition; không phải giá bán quan sát từ nguồn. Tồn kho tự tạo để có cả hết hàng/thấp/còn hàng.
- Compatibility có `is_demo=true`. Chỉ nhóm parts có ý nghĩa engine-specific được gán fitment demo; cabin/landing gear không bị ép thành replacement engine parts.

Schema chuẩn: `docs/database/database-schema.dbml`. Không thay schema để tạo dữ liệu. Company và category có trong gold để đáp ứng FK của các bảng con. Trường runtime như users/orders/payments/reviews do website tạo, không bắt buộc seed từ dataset.
Gold dùng một bộ dữ liệu duy nhất: metadata nguồn được giữ ở các trường
`source_*`, `technical_specs`, hoặc `evidence_reference` nơi schema hiện có;
các giá trị `DEMO-*` và `is_demo=true` biểu thị dữ liệu synthetic. Không chạy
pipeline để ghi đè database production sau khi website đã có dữ liệu runtime.

C-MAPSS/model/scaler chưa có. Pipeline này không tự tạo model artifact hay giả kết quả inference thật; dữ liệu nền marketplace không phụ thuộc bước AI.

## Chạy lại

Các script thay thế đúng những CSV output chúng quản lý; không sửa bronze, không sửa database đang chạy. Gold được kiểm tra trong bộ nhớ trước khi ghi. CSV dùng UTF-8, hàng đầu là tên cột; ô rỗng tương ứng NULL cho cột nullable. Đây là seed cho database trống: nạp theo thứ tự ở `data/gold/README.md`; reset sequence sau import ID tường minh trên PostgreSQL.

`archive/dataset_repository` giữ repository Dataset cũ; không dùng làm nguồn active. `bronze_manifest.csv` giữ SHA-256 để xác nhận raw không đổi. Không có folder data-mapping trong workflow hiện tại.
