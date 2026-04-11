// wwwroot/js/contract-icons.js
// ICON HỢP ĐỒNG SIÊU ĐA DẠNG 2025 – KHÔNG TRÙNG LẪN, ĐẸP NHƯỚ TỪNG CHI TIẾT

const CONTRACT_ICON_MAP = {
    // TRẢ TRƯỚC – ICON SIÊU ĐẸP, MÀU XANH NGỌC, KHÔNG TRÙNG VỚI AI!
    "trả trước": ["ti-coins", "gradient-prepayment"],
    "trả trước hợp đồng": ["ti-coins", "gradient-prepayment"],
    "tiền trả trước": ["ti-coins", "gradient-prepayment"],
    "đặt trước": ["ti-hand-stop", "gradient-prepayment"],
    "phí trả trước": ["ti-receipt-off", "gradient-prepayment"]
    ,
    // ĐẶT CỌC – VÀNG KIM CƯƠNG, SIÊU SANG
    "đặt cọc": ["ti-lock-square-rounded", "gradient-deposit"],
    "cọc": ["ti-lock-square-rounded", "gradient-deposit"],
    "đặt cọc nhà": ["ti-home-lock", "gradient-deposit"],
    "đặt cọc hợp đồng": ["ti-file-lock", "gradient-deposit"],

    // TRẢ GÓP – LỊCH THANH TOÁN
    "góp": ["ti-calendar-dollar", "gradient-installment"],
    "trả góp": ["ti-calendar-dollar", "gradient-installment"],
    "góp 12 kỳ": ["ti-calendar-time", "gradient-installment"],
    "góp 24 kỳ": ["ti-calendar-event", "gradient-installment"],

    // TRẢ 100% – TIỀN MẶT
    "trả 100%": ["ti-cash-banknote", "gradient-fullpay"],
    "toàn bộ": ["ti-wallet", "gradient-fullpay"],
    "trả hết": ["ti-moneybag", "gradient-fullpay"],
    "thanh toán một lần": ["ti-credit-card", "gradient-fullpay"],

    // PHẠT, VI PHẠM – CẢNH BÁO
    "phạt": ["ti-alert-circle", "gradient-penalty"],
    "vi phạm": ["ti-exclamation-mark", "gradient-penalty"],
    "phạt chậm": ["ti-clock-exclamation", "gradient-penalty"],
    "bồi thường": ["ti-scale", "gradient-penalty"],
    "phạt hợp đồng": ["ti-gavel", "gradient-penalty"],

    // TIỀN THUÊ NHÀ
    "tiền thuê": ["ti-building-estate", "gradient-rent"],
    "thuê nhà": ["ti-home-dollar", "gradient-rent"],
    "tiền nhà": ["ti-home-heart", "gradient-rent"],

    // PHÍ QUẢN LÝ & DỊCH VỤ
    "phí quản lý": ["ti-building-skyscraper", "gradient-management"],
    "phí dịch vụ": ["ti-tools-kitchen-2", "gradient-service"],
    "phí tiện ích": ["ti-bulb", "gradient-service"],

    // GỬI XE
    "gửi xe": ["ti-parking", "gradient-parking"],
    "ô tô": ["ti-car", "gradient-car"],
    "xe máy": ["ti-motorbike", "gradient-motorbike"],
    "xe đạp": ["ti-bike", "gradient-motorbike"],

    // BẢO TRÌ, SỬA CHỮA
    "bảo trì": ["ti-tools", "gradient-maintenance"],
    "sửa chữa": ["ti-wrench", "gradient-maintenance"],
    "bảo dưỡng": ["ti-settings", "gradient-maintenance"],

    // CÁC PHÍ KHÁC
    "phí khác": ["ti-receipt", "gradient-other"],
    "phí phát sinh": ["ti-receipt-tax", "gradient-other"],
    "chi phí khác": ["ti-coins", "gradient-other"]
};

// Chuẩn hóa tiếng Việt
function normalizeVietnamese(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d");
}

// Tìm icon phù hợp nhất – ưu tiên từ dài → ngắn
function getContractIcon(tenLoaiTT) {
    if (!tenLoaiTT) return ["ti-file-invoice", "gradient-contract"];

    const normalized = normalizeVietnamese(tenLoaiTT);

    // Sắp xếp key theo độ dài giảm dần để ưu tiên từ khóa dài trước
    const sortedKeys = Object.keys(CONTRACT_ICON_MAP).sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeys) {
        if (normalized.includes(normalizeVietnamese(keyword))) {
            return CONTRACT_ICON_MAP[keyword];
        }
    }

    return ["ti-file-invoice-dollar", "gradient-contract"]; // default đẹp hơn
}