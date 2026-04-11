// wwwroot/js/loading.js
let loadingStartTime = null;

// Biến để theo dõi xem loading đang hiển thị hay không
let isLoadingShowing = false;

// Hàm toggleLoading để hiển thị hoặc ẩn loading
// - show: true (hiển thị) hoặc false (ẩn)
// - selectors: phần tử HTML muốn làm mờ (mặc định là "body")
function toggleLoading(show, selectors = "body") {
    if (show) {
        // Hiển thị loading
        isLoadingShowing = true;
        $("#loading").show(); // Hiển thị logo loading
        $(selectors).css("opacity", "0.5"); // Làm mờ khu vực được chọn
    } else {
        // Ẩn loading, nhưng đợi ít nhất 200ms
        if (isLoadingShowing) {
            setTimeout(function () {
                $("#loading").hide(); // Ẩn logo loading
                $(selectors).css("opacity", "1"); // Khôi phục độ mờ
                isLoadingShowing = false; // Đánh dấu loading đã ẩn
            }, 200); // Đợi 200ms
        }
    }
}