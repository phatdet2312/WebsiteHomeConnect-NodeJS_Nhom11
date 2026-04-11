// wwwroot/js/service-icons.js
// TỰ ĐỘNG GÁN ICON + MÀU GRADIENT CHO MỌI DỊCH VỤ – HOÀN HẢO VỚI TIẾNG VIỆT CÓ DẤU

// wwwroot/js/service-icons.js – DÙNG FONT AWESOME 6 (HOÀN HẢO!)
// wwwroot/js/service-icons.js – DÙNG TABLER ICONS (ĐẸP NHẤT THẾ GIỚI 2025)
const SERVICE_ICON_MAP = {
    "điện": ["ti-bolt", "gradient-electric"],
    "nước": ["ti-droplet", "gradient-water"],
    "internet": ["ti-wifi", "gradient-internet"],
    "wifi": ["ti-wifi", "gradient-internet"],
    "rác": ["ti-trash", "gradient-trash"],
    "vệ sinh": ["ti-vacuum-cleaner", "gradient-clean"],
    "gửi xe": ["ti-parking", "gradient-parking"],
    "xe máy": ["ti-motorbike", "gradient-parking"],
    "ô tô": ["ti-car", "gradient-parking"],
    "bảo vệ": ["ti-shield-lock", "gradient-security"],
    "an ninh": ["ti-shield-check", "gradient-security"],
    "thang máy": ["ti-elevator", "gradient-elevator"],
    "phí quản lý": ["ti-building-skyscraper", "gradient-management"],
    "hồ bơi": ["ti-pool", "gradient-pool"],
    "gym": ["ti-dumbbell", "gradient-gym"],
    "tiện ích": ["ti-star", "gradient-amenity"],
    "khu vui chơi": ["ti-trees", "gradient-amenity"],
    "gas": ["ti-flame", "gradient-gas"],
    "bảo trì": ["ti-tools", "gradient-maintenance"],
    "cáp": ["ti-device-tv", "gradient-cable"],
    "truyền hình": ["ti-device-tv", "gradient-cable"]
};

// Hàm chuẩn hóa tiếng Việt có dấu
function normalizeVietnamese(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d");
}

// Tìm icon phù hợp nhất
function getServiceIcon(tenDichVu) {
    if (!tenDichVu) return ["bi-question-circle-fill", "gradient-default"];

    const normalized = normalizeVietnamese(tenDichVu);

    for (const [keyword, config] of Object.entries(SERVICE_ICON_MAP)) {
        if (normalized.includes(normalizeVietnamese(keyword))) {
            return config;
        }
    }

    // Mặc định đẹp nếu không tìm thấy
    return ["bi-grid-3x3-gap-fill", "gradient-default"];
}