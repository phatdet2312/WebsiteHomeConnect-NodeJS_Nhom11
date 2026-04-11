/*wwwroot/js/danhgia.js*/

let phanHoiListStates = {};

const DanhGiaManager = {
    // Hiển thị/ẩn ô nhập phản hồi đánh giá
    showPhanHoiInput(maDG) {
        const input = document.getElementById(`phanHoiInput-${maDG}`);
        input.style.display = input.style.display === "none" ? "block" : "none";
    },

    // Thêm phương thức để trả lời và tag tên khách hàng
    replyToPhanHoiDanhGia(maDG, maKH, tenKH) {
        const input = document.getElementById(`phanHoiInput-${maDG}`);
        const textarea = document.getElementById(`phanHoiInputText-${maDG}`);
        input.style.display = "block";
        textarea.value = `@${tenKH} `; // Hiển thị @TênKháchHàng đầy đủ
        textarea.dataset.originalValue = `@KH${maKH} `; // Lưu @KHx
        textarea.dataset.tenKH = tenKH; // Lưu tenKH
        textarea.focus();
        this.updateCharCount(`phanHoiInputText-${maDG}`, `phanHoiCharCount-${maDG}`, 500);
        // Định dạng @TênKháchHàng in đậm, màu xanh
        $(textarea).css({
            'font-weight': 'bold',
            'color': '#007bff'
        }).on('input', function () {
            // Bỏ định dạng khi nhập nội dung mới
            if (this.value.length > `@${tenKH} `.length) {
                $(this).css({
                    'font-weight': 'normal',
                    'color': '#ffffff'
                });
            }
        });
    },

    // Mở danh sách phản hồi đánh giá
    showPhanHoiDanhGia(maDG) {
        const phanHoiList = document.getElementById(`phanHoiList-${maDG}`);
        const viewLink = document.querySelector(`.danhgia-item[data-madg='${maDG}'] .view-replies`);
        const hideLink = document.querySelector(`.danhgia-item[data-madg='${maDG}'] .hide-replies`);

        $.ajax({
            url: '/Home/GetPhanHoiDanhGiaByMaDG',
            type: 'GET',
            data: { maDG: maDG, pageNumber: 1, pageSize: 5 },
            success: function (data) {
                phanHoiList.innerHTML = data;
                phanHoiList.style.display = 'block';
                phanHoiListStates[maDG] = true;
                viewLink.style.display = 'none';
                hideLink.style.display = 'inline';
                // Thu gọn nội dung phản hồi
                DanhGiaManager.truncatePhanHoiContent(phanHoiList);
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Không thể tải danh sách phản hồi. Vui lòng thử lại!',
                    confirmButtonText: 'Đóng'
                });
            }
        });
    },

    // Đóng danh sách phản hồi đánh giá
    hidePhanHoiDanhGia(maDG) {
        const phanHoiList = document.getElementById(`phanHoiList-${maDG}`);
        const viewLink = document.querySelector(`.danhgia-item[data-madg='${maDG}'] .view-replies`);
        const hideLink = document.querySelector(`.danhgia-item[data-madg='${maDG}'] .hide-replies`);

        phanHoiList.style.display = 'none';
        phanHoiListStates[maDG] = false;
        viewLink.style.display = 'inline';
        hideLink.style.display = 'none';
    },

    toggleDanhGiaContent(maDG) {
        const text = document.getElementById(`danhgiaText-${maDG}`);
        const readMoreBtn = document.getElementById(`readMoreDanhGiaBtn-${maDG}`);
        const readLessBtn = document.getElementById(`readLessDanhGiaBtn-${maDG}`);
        if (readMoreBtn.style.display === "inline-block") {
            text.innerHTML = text.dataset.fullText;
            readMoreBtn.style.display = "none";
            readLessBtn.style.display = "inline-block";
        } else {
            text.innerHTML = text.dataset.truncatedText;
            readMoreBtn.style.display = "inline-block";
            readLessBtn.style.display = "none";
        }
    },

    togglePhanHoiContent(maPHDG) {
        const text = document.getElementById(`phanHoiText-${maPHDG}`);
        const readMoreBtn = document.getElementById(`readMorePhanHoiBtn-${maPHDG}`);
        const readLessBtn = document.getElementById(`readLessPhanHoiBtn-${maPHDG}`);
        if (readMoreBtn.style.display === "inline-block") {
            text.innerHTML = text.dataset.fullText;
            readMoreBtn.style.display = "none";
            readLessBtn.style.display = "inline-block";
        } else {
            text.innerHTML = text.dataset.truncatedText;
            readMoreBtn.style.display = "inline-block";
            readLessBtn.style.display = "none";
        }
    },

    truncateDanhGiaContent() {
        $(".danhgia-item").each(function () {
            const maDG = $(this).data("madg");
            const text = document.getElementById(`danhgiaText-${maDG}`);
            if (text) {
                const fullText = text.innerText || '';
                const words = fullText.split(/\s+/).filter(word => word.length > 0);
                if (words.length > 27) {
                    const truncatedText = words.slice(0, 27).join(' ') + '…';
                    text.innerHTML = truncatedText;
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = truncatedText;
                    document.getElementById(`readMoreDanhGiaBtn-${maDG}`).style.display = "inline-block";
                } else {
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = fullText;
                    document.getElementById(`readMoreDanhGiaBtn-${maDG}`).style.display = "none";
                    document.getElementById(`readLessDanhGiaBtn-${maDG}`).style.display = "none";
                }
            }
        });
    },

    truncatePhanHoiContent(phanHoiList) {
        $(phanHoiList).find(".phanhoi-item").each(function () {
            const maPHDG = $(this).data("maphdg");
            const text = document.getElementById(`phanHoiText-${maPHDG}`);
            if (text) {
                const fullText = text.innerHTML || '';
                const words = fullText.split(/\s+/).filter(word => word.length > 0);
                if (words.length > 27) {
                    const truncatedText = words.slice(0, 27).join(' ') + '…';
                    text.innerHTML = truncatedText;
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = truncatedText;
                    document.getElementById(`readMorePhanHoiBtn-${maPHDG}`).style.display = "inline-block";
                } else {
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = fullText;
                    document.getElementById(`readMorePhanHoiBtn-${maPHDG}`).style.display = "none";
                    document.getElementById(`readLessPhanHoiBtn-${maPHDG}`).style.display = "none";
                }
            }
        });
    },

    // Gửi đánh giá mới
    submitDanhGia(maSP) {
        const noiDung = $("#danhGiaInput").val().trim();
        const sao = $("#starRating i.selected").last().data("value") || 5;
        $.ajax({
            url: '/Home/AddDanhGia',
            type: 'POST',
            data: {
                maSP: maSP,
                noiDungDG: noiDung,
                sao: sao,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else if (data.success === false) {
                    hienThiLoi(data.message || 'Không thể gửi đánh giá. Vui lòng thử lại!');
                } else {
                    $("#danhGiaList").html(data);
                    $("#danhGiaInput").val("");
                    $("#starRating i").removeClass("selected");
                    $("#starRating i[data-value='5']").addClass("selected");
                    hienThiThanhCong('Đánh giá đã được gửi!');
                }
            },
            error: function () {
                hienThiLoi('Không thể gửi đánh giá. Vui lòng thử lại!');
            }
        });
    },

    // Gửi phản hồi đánh giá mới
    submitPhanHoiDanhGia(maDG) {
        const textarea = $(`#phanHoiInputText-${maDG}`);
        let noiDung = textarea.val().trim();
        if (kiemTraNoiDungRong(noiDung, 'Vui lòng nhập nội dung phản hồi!')) return;

        if (textarea[0].dataset.originalValue && textarea[0].dataset.tenKH) {
            const originalValue = textarea[0].dataset.originalValue; // @KHx
            const tenKH = textarea[0].dataset.tenKH; // TênKháchHàng
            const tag = `@${tenKH} `;

            // Kiểm tra xem noiDung có bắt đầu bằng tag không
            if (noiDung.startsWith(tag)) {
                noiDung = originalValue + noiDung.substring(tag.length).trim();
            } else {
                // Nếu người dùng xóa tag, chỉ giữ nội dung
                noiDung = noiDung;
            }
        }

        $.ajax({
            url: '/Home/AddPhanHoiDanhGia',
            type: 'POST',
            data: {
                maDG: maDG,
                noiDungPHDG: noiDung,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    const phanHoiList = $(`#phanHoiList-${maDG}`);
                    phanHoiList.html(data);
                    phanHoiList.show();
                    $(`#phanHoiInputText-${maDG}`).val("");
                    $(`#phanHoiInput-${maDG}`).hide();
                    const viewLink = $(`.danhgia-item[data-madg='${maDG}'] .view-replies`);
                    const hideLink = $(`.danhgia-item[data-madg='${maDG}'] .hide-replies`);
                    let soLuongPhanHoi = parseInt(viewLink.attr('data-so-luong-phanhoi') || 0) + 1;
                    if (viewLink.length === 0) {
                        const actions = $(`.danhgia-item[data-madg='${maDG}'] .danhgia-actions`);
                        actions.append(`<a class="view-replies" onclick="DanhGiaManager.showPhanHoiDanhGia(${maDG})" data-madg="${maDG}" data-so-luong-phanhoi="${soLuongPhanHoi}">Xem ${soLuongPhanHoi} phản hồi</a>`);
                        actions.append(`<a class="hide-replies" onclick="DanhGiaManager.hidePhanHoiDanhGia(${maDG})" data-madg="${maDG}" style="display: inline;">Ẩn phản hồi</a>`);
                        phanHoiListStates[maDG] = true;
                    } else {
                        viewLink.attr('data-so-luong-phanhoi', soLuongPhanHoi);
                        viewLink.text(`Xem ${soLuongPhanHoi} phản hồi`);
                        viewLink.hide();
                        hideLink.show();
                        phanHoiListStates[maDG] = true;
                    }
                    DanhGiaManager.truncatePhanHoiContent(phanHoiList);
                    hienThiThanhCong('Phản hồi đã được gửi!');
                }
            },
            error: function () {
                hienThiLoi('Không thể gửi phản hồi. Vui lòng thử lại!');
            }
        });
    },

    // Chỉnh sửa đánh giá
    editDanhGia(maDG) {
        const contentDiv = document.getElementById(`content-${maDG}`);
        const editInput = document.getElementById(`editInput-${maDG}`);
        contentDiv.style.display = "none";
        editInput.style.display = "block";
        const textarea = document.getElementById(`editInputText-${maDG}`);
        const starRating = document.getElementById(`editStarRating-${maDG}`);
        const currentSao = parseInt(contentDiv.dataset.sao);
        $(starRating).find('i').removeClass('selected');
        $(starRating).find(`i[data-value="${currentSao}"]`).addClass('selected').prevAll().addClass('selected');
        this.updateCharCount(`editInputText-${maDG}`, `editCharCount-${maDG}`, 300);
    },

    submitEditDanhGia(maDG) {
        const noiDung = document.querySelector(`#editInput-${maDG} textarea`).value.trim();
        const sao = $(`#editStarRating-${maDG} i.selected`).last().data("value") || 5;
        $.ajax({
            url: '/Home/EditDanhGia',
            type: 'POST',
            data: {
                maDG: maDG,
                noiDungDG: noiDung,
                sao: sao,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                $("#danhGiaList").html(data);
                hienThiThanhCong('Đánh giá đã được chỉnh sửa!');
            },
            error: function () {
                hienThiLoi('Không thể chỉnh sửa đánh giá. Vui lòng thử lại!');
            }
        });
    },

    cancelEditDanhGia(maDG) {
        const contentDiv = document.getElementById(`content-${maDG}`);
        const editInput = document.getElementById(`editInput-${maDG}`);
        contentDiv.style.display = "block";
        editInput.style.display = "none";
    },

    deleteDanhGia(maDG) {
        Swal.fire({
            icon: 'question',
            title: 'Xác nhận',
            text: 'Bạn có chắc muốn xóa đánh giá này?',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/Home/DeleteDanhGia',
                    type: 'POST',
                    data: {
                        maDG: maDG,
                        '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (data) {
                        if (typeof data === 'object' && data.success === false) {
                            hienThiLoi(data.message || 'Không thể xóa đánh giá. Vui lòng thử lại!');
                        } else {
                            $("#danhGiaList").html(data);
                            hienThiThanhCong('Đánh giá đã được xóa!');
                        }
                    },
                    error: function (xhr) {
                        if (xhr.status === 401 || xhr.status === 403) {
                            window.location.href = '/Identity/Account/Login?returnUrl=/Home/ChiTietSanPham';
                        } else {
                            hienThiLoi('Không thể xóa đánh giá. Vui lòng thử lại!');
                        }
                    }
                });
            }
        });
    },

    // Chỉnh sửa phản hồi đánh giá
    editPhanHoiDanhGia(maPHDG) {
        const contentDiv = document.getElementById(`phanhoi-content-${maPHDG}`);
        const editInput = document.getElementById(`edit-phanhoi-input-${maPHDG}`);
        const textarea = document.getElementById(`edit-phanhoi-input-text-${maPHDG}`);

        // Gọi AJAX để lấy nội dung đã chuyển đổi
        $.ajax({
            url: '/Home/GetNoiDungForEdit',
            type: 'GET',
            data: { type: 'PhanHoiDanhGia', id: maPHDG },
            success: function (data) {
                if (data.success) {
                    textarea.value = data.noiDung;
                    contentDiv.style.display = "none";
                    editInput.style.display = "block";
                    DanhGiaManager.updateCharCount(`edit-phanhoi-input-text-${maPHDG}`, `edit-phanhoi-char-count-${maPHDG}`, 500);
                } else {
                    hienThiLoi(data.message || 'Không thể tải nội dung chỉnh sửa.');
                }
            },
            error: function () {
                hienThiLoi('Không thể tải nội dung chỉnh sửa.');
            }
        });
    },

    submitEditPhanHoiDanhGia(maPHDG) {
        const noiDung = document.querySelector(`#edit-phanhoi-input-${maPHDG} textarea`).value.trim();
        if (kiemTraNoiDungRong(noiDung, 'Vui lòng nhập nội dung phản hồi!')) return;

        $.ajax({
            url: '/Home/EditPhanHoiDanhGia',
            type: 'POST',
            data: {
                maPHDG: maPHDG,
                noiDungPHDG: noiDung,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (typeof data === 'object' && data.success === false) {
                    hienThiLoi(data.message || 'Không thể chỉnh sửa phản hồi. Vui lòng thử lại!');
                } else {
                    const phanHoiList = $(`.phanhoi-list:has(.phanhoi-item[data-maphdg='${maPHDG}'])`);
                    phanHoiList.html(data);
                    DanhGiaManager.truncatePhanHoiContent(phanHoiList);
                    hienThiThanhCong('Phản hồi đã được chỉnh sửa!');
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    window.location.href = '/Identity/Account/Login?returnUrl=/Home/ChiTietSanPham';
                } else {
                    hienThiLoi('Không thể chỉnh sửa phản hồi. Vui lòng thử lại!');
                }
            }
        });
    },

    cancelEditPhanHoiDanhGia(maPHDG) {
        const contentDiv = document.getElementById(`phanhoi-content-${maPHDG}`);
        const editInput = document.getElementById(`edit-phanhoi-input-${maPHDG}`);
        contentDiv.style.display = "block";
        editInput.style.display = "none";
    },

    deletePhanHoiDanhGia(maPHDG) {
        Swal.fire({
            icon: 'question',
            title: 'Xác nhận',
            text: 'Bạn có chắc muốn xóa phản hồi này?',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/Home/DeletePhanHoiDanhGia',
                    type: 'POST',
                    data: {
                        maPHDG: maPHDG,
                        '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (data) {
                        if (typeof data === 'object' && data.success === false) {
                            hienThiLoi(data.message || 'Không thể xóa phản hồi. Vui lòng thử lại!');
                        } else {
                            const phanHoiList = $(`.phanhoi-list:has(.phanhoi-item[data-maphdg='${maPHDG}'])`);
                            phanHoiList.html(data);
                            const count = phanHoiList.find(".phanhoi-item").length;
                            const viewLink = $(`.danhgia-item:has(.phanhoi-list:has(.phanhoi-item[data-maphdg='${maPHDG}'])) .view-replies`);
                            if (count > 0) {
                                viewLink.text(`Xem ${count} phản hồi`);
                            } else {
                                viewLink.remove();
                            }
                            DanhGiaManager.truncatePhanHoiContent(phanHoiList);
                            hienThiThanhCong('Phản hồi đã được xóa!');
                        }
                    },
                    error: function (xhr) {
                        if (xhr.status === 401 || xhr.status === 403) {
                            window.location.href = '/Identity/Account/Login?returnUrl=/Home/ChiTietSanPham';
                        } else {
                            hienThiLoi('Không thể xóa phản hồi. Vui lòng thử lại!');
                        }
                    }
                });
            }
        });
    },

    // Like đánh giá
    likeDanhGia(maDG) {
        $.ajax({
            url: '/Home/LikeDanhGia',
            type: 'POST',
            data: {
                maDG: maDG,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                    window.location.href = data.redirect; // Chuyển hướng nếu chưa đăng nhập
                } else if (data.success) {
                    const likeLink = $(`.danhgia-item[data-madg='${maDG}'] .danhgia-actions .like-link`);
                    const likeCount = likeLink.find('.like-count');
                    likeLink.toggleClass('liked', data.daThich);
                    likeCount.text(data.soLuotThich > 0 ? data.soLuotThich : '');
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công',
                        text: data.daThich ? 'Đã thích đánh giá!' : 'Đã bỏ thích đánh giá!',
                        confirmButtonText: 'Đóng',
                        timer: 1500
                    });
                } else {
                    hienThiLoi(data.message || 'Không thể thực hiện thao tác. Vui lòng thử lại!');
                }
            },
            error: function () {
                hienThiLoi('Không thể thực hiện thao tác. Vui lòng thử lại!');
            }
        });
    },

    // Like phản hồi đánh giá
    likePhanHoiDanhGia(maPHDG) {
        $.ajax({
            url: '/Home/LikePhanHoiDanhGia',
            type: 'POST',
            data: {
                maPHDG: maPHDG,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                    window.location.href = data.redirect; // Chuyển hướng nếu chưa đăng nhập
                } else if (data.success) {
                    const likeLink = $(`.phanhoi-item[data-maphdg='${maPHDG}'] .phanhoi-actions .like-link`);
                    const likeCount = likeLink.find('.like-count');
                    likeLink.toggleClass('liked', data.daThich);
                    likeCount.text(data.soLuotThich > 0 ? data.soLuotThich : '');
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công',
                        text: data.daThich ? 'Đã thích phản hồi!' : 'Đã bỏ thích phản hồi!',
                        confirmButtonText: 'Đóng',
                        timer: 1500
                    });
                } else {
                    hienThiLoi(data.message || 'Không thể thực hiện thao tác. Vui lòng thử lại!');
                }
            },
            error: function () {
                hienThiLoi('Không thể thực hiện thao tác. Vui lòng thử lại!');
            }
        });
    },


    // Phân trang
    taiThemDanhGia(maSP, pageNumber) {
        taiThemDuLieu('/Home/GetDanhGiaByMaSP', 'maSP', maSP, pageNumber);
    },

    taiThemPhanHoiDanhGia(maDG, pageNumber) {
        taiThemDuLieu('/Home/GetPhanHoiDanhGiaByMaDG', 'maDG', maDG, pageNumber);
    },

    // Cập nhật số ký tự còn lại
    updateCharCount(inputId, countId, maxLength) {
        const input = document.getElementById(inputId);
        const countSpan = document.getElementById(countId);
        const remaining = maxLength - input.value.length;
        countSpan.textContent = `Còn ${remaining} ký tự`;
    }
};

// Hàm kiểm tra nội dung rỗng
function kiemTraNoiDungRong(noiDung, thongBao) {
    if (noiDung.trim() === "") {
        Swal.fire({
            icon: 'warning',
            title: 'Cảnh báo',
            text: thongBao,
            confirmButtonText: 'Đóng'
        });
        return true;
    }
    return false;
}

// Hàm hiển thị thông báo thành công
function hienThiThanhCong(thongBao) {
    Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: thongBao,
        confirmButtonText: 'Đóng'
    });
}

// Hàm hiển thị lỗi
function hienThiLoi(thongBao) {
    Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: thongBao,
        confirmButtonText: 'Đóng'
    });
}

// Xử lý chọn sao và khởi tạo
$(document).ready(function () {
    $("#starRating i").on("click", function () {
        const value = $(this).data("value");
        $("#starRating i").removeClass("selected");
        $(this).addClass("selected").prevAll().addClass("selected");
    });

    $("#starRating i").each(function () {
        if ($(this).data("value") <= 5) {
            $(this).addClass("selected");
        }
    });

    $(document).on("click", ".edit-input .star-rating i", function () {
        const value = $(this).data("value");
        const starRating = $(this).closest(".star-rating");
        starRating.find("i").removeClass("selected");
        $(this).addClass("selected").prevAll().addClass("selected");
    });

    $("#danhGiaInput").on("input", function () {
        DanhGiaManager.updateCharCount("danhGiaInput", "danhGiaCharCount", 300);
    });

    $(document).on("input", ".phanhoi-input textarea", function () {
        const maDG = $(this).closest(".phanhoi-input").attr("id").replace("phanHoiInput-", "");
        DanhGiaManager.updateCharCount(this.id, `phanHoiCharCount-${maDG}`, 500);
    });

    $(document).on("input", ".edit-input-danhgia textarea, .edit-input-phanhoi-danhgia textarea", function () {
        const id = $(this).closest(".edit-input").attr("id");
        if (id.startsWith("edit-phanhoi-input-")) {
            const maPHDG = id.replace("edit-phanhoi-input-", "");
            DanhGiaManager.updateCharCount(this.id, `edit-phanhoi-char-count-${maPHDG}`, 500);
        } else if (id.startsWith("editInput-")) {
            const maDG = id.replace("editInput-", "");
            DanhGiaManager.updateCharCount(this.id, `editCharCount-${maDG}`, 300);
        }
    });

    DanhGiaManager.truncateDanhGiaContent();
});