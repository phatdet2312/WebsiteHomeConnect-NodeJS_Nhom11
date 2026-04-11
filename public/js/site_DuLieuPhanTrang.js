
/*js/site_DuLieuPhanTrang.js */

function taiThemDuLieu(duongDan, thamSoDoiTuong, maDoiTuong, trangHienTai) {
    let url = duongDan + '?' + thamSoDoiTuong + '=' + maDoiTuong + '&pageNumber=' + trangHienTai + '&pageSize=5';
    console.log('Tải dữ liệu:', url);
    $.ajax({
        url: url,
        type: 'GET',
        success: function (data) {
            let idDanhSach = '';
            // Ưu tiên kiểm tra PhanHoiDanhGia trước
            if (duongDan.includes('PhanHoiDanhGia')) {
                idDanhSach = '#phanHoiList-' + maDoiTuong;
            } else if (duongDan.includes('TraLoi')) {
                idDanhSach = '#replyList-' + maDoiTuong;
            } else if (duongDan.includes('PhanHoi')) {
                idDanhSach = '#phanHoiList';
            } else if (duongDan.includes('DanhGia')) {
                idDanhSach = '#danhGiaList';
            } else if (duongDan.includes('SanPham')) {
                idDanhSach = '#danhSachSanPham';
            }
            console.log('Cập nhật container:', idDanhSach);
            $(idDanhSach).html(data);
            if (idDanhSach.includes('replyList-') || idDanhSach.includes('phanHoiList-')) {
                const list = $(idDanhSach);
                list.show();
                const count = list.find(".reply-item, .phanhoi-item").length;
                const viewLink = $(`.comment-item[data-maph='${maDoiTuong}'] .view-replies, .danhgia-item[data-madg='${maDoiTuong}'] .view-replies`);
                const hideLink = $(`.comment-item[data-maph='${maDoiTuong}'] .hide-replies, .danhgia-item[data-madg='${maDoiTuong}'] .hide-replies`);
                console.log('Số mục:', count, 'ViewLink:', viewLink.length);
                if (count > 0) {
                    viewLink.text(`Xem ${count} ${idDanhSach.includes('replyList-') ? 'câu trả lời' : 'phản hồi'}`);
                    viewLink.hide();
                    hideLink.show();
                } else {
                    viewLink.remove();
                    hideLink.remove();
                }
                // Thu gọn nội dung phản hồi đánh giá nếu cần
                if (idDanhSach.includes('phanHoiList-')) {
                    setTimeout(() => {
                        DanhGiaManager.truncatePhanHoiContent(list[0]);
                    }, 100);
                }
            }
        },
        error: function (xhr, status, error) {
            console.error('Lỗi AJAX:', status, error, xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể tải dữ liệu. Vui lòng thử lại!',
                confirmButtonText: 'Đóng'
            });
        }
    });
}