/*wwwroot/js/comment.js*/

let replyListStates = {};
const CommentManager = {
    // Hiển thị/ẩn ô nhập trả lời cho bình luận
    showReplyInput(maPH) {
        const input = document.getElementById(`replyInput-${maPH}`);
        input.style.display = input.style.display === "none" ? "block" : "none";
    },

   

    replyToTraLoi(maPH, maKH, tenKH) {
        const input = document.getElementById(`replyInput-${maPH}`);
        const textarea = document.getElementById(`replyInputText-${maPH}`);
        input.style.display = "block";
        textarea.value = `@${tenKH} `; // Hiển thị @TênKháchHàng đầy đủ
        textarea.dataset.originalValue = `@KH${maKH} `; // Lưu @KHx
        textarea.dataset.tenKH = tenKH; // Lưu tenKH để kiểm tra khi gửi
        textarea.focus();
        this.updateCharCount(`replyInputText-${maPH}`, `replyCharCount-${maPH}`, 500);
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

    // Mở danh sách trả lời
    showReplies(maPH) {
        const replyList = document.getElementById(`replyList-${maPH}`);
        const viewLink = document.querySelector(`.comment-item[data-maph='${maPH}'] .view-replies`);
        const hideLink = document.querySelector(`.comment-item[data-maph='${maPH}'] .hide-replies`);

        $.ajax({
            url: '/Home/GetTraLoiByMaPH',
            type: 'GET',
            data: { maPH: maPH, pageNumber: 1, pageSize: 5 },
            success: function (data) {
                replyList.innerHTML = data;
                replyList.style.display = 'block';
                replyListStates[maPH] = true;
                viewLink.style.display = 'none';
                hideLink.style.display = 'inline';
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Không thể tải danh sách trả lời. Vui lòng thử lại!',
                    confirmButtonText: 'Đóng'
                });
            }
        });
    },

    
    // Đóng danh sách trả lời
    hideReplies(maPH) {
        const replyList = document.getElementById(`replyList-${maPH}`);
        const viewLink = document.querySelector(`.comment-item[data-maph='${maPH}'] .view-replies`);
        const hideLink = document.querySelector(`.comment-item[data-maph='${maPH}'] .hide-replies`);

        replyList.style.display = 'none';
        replyListStates[maPH] = false;
        viewLink.style.display = 'inline';
        hideLink.style.display = 'none';
    },

    
    // Thu gọn/mở rộng nội dung bình luận
    toggleCommentContent(maPH) {
        const text = document.getElementById(`commentText-${maPH}`);
        const readMoreBtn = document.getElementById(`readMoreCommentBtn-${maPH}`);
        const readLessBtn = document.getElementById(`readLessCommentBtn-${maPH}`);
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

    // Thu gọn/mở rộng nội dung trả lời
    toggleReplyContent(maTL) {
        const text = document.getElementById(`replyText-${maTL}`);
        const readMoreBtn = document.getElementById(`readMoreReplyBtn-${maTL}`);
        const readLessBtn = document.getElementById(`readLessReplyBtn-${maTL}`);
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

    // Thu gọn nội dung bình luận
    truncateCommentContent() {
        $(".comment-item").each(function () {
            const maPH = $(this).data("maph");
            const text = document.getElementById(`commentText-${maPH}`);
            if (text) {
                const fullText = text.innerText || '';
                const words = fullText.split(/\s+/).filter(word => word.length > 0);
                if (words.length > 27) {
                    const truncatedText = words.slice(0, 27).join(' ') + '…';
                    text.innerHTML = truncatedText;
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = truncatedText;
                    document.getElementById(`readMoreCommentBtn-${maPH}`).style.display = "inline-block";
                } else {
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = fullText;
                    document.getElementById(`readMoreCommentBtn-${maPH}`).style.display = "none";
                    document.getElementById(`readLessCommentBtn-${maPH}`).style.display = "none";
                }
            }
        });
    },

    // Thu gọn nội dung trả lời
    truncateReplyContent(replyList) {
        $(replyList).find(".reply-item").each(function () {
            const maTL = $(this).data("matl");
            const text = document.getElementById(`replyText-${maTL}`);
            if (text) {
                const fullText = text.innerHTML || '';
                const words = fullText.split(/\s+/).filter(word => word.length > 0);
                if (words.length > 27) {
                    const truncatedText = words.slice(0, 27).join(' ') + '…';
                    text.innerHTML = truncatedText;
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = truncatedText;
                    document.getElementById(`readMoreReplyBtn-${maTL}`).style.display = "inline-block";
                } else {
                    text.dataset.fullText = fullText;
                    text.dataset.truncatedText = fullText;
                    document.getElementById(`readMoreReplyBtn-${maTL}`).style.display = "none";
                    document.getElementById(`readLessReplyBtn-${maTL}`).style.display = "none";
                }
            }
        });
    },
   

   


    // "Gửi"" bình luận mới cho sản phẩm
    submitPhanHoi(maSP) {
        const noiDung = $("#phanHoiInput").val().trim();
        if (kiemTraNoiDungRong(noiDung, 'Vui lòng nhập nội dung bình luận!')) return;
        $.ajax({
            url: '/Home/AddPhanHoi',
            type: 'POST',
            data: {
                maSP: maSP,
                noiDungPH: noiDung,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                   
                    window.location.href = data.redirect; // Chuyển hướng nếu có trường redirect
                } else {
                    $("#phanHoiList").html(data);
                    $("#phanHoiInput").val("");
                    hienThiThanhCong('Bình luận đã được gửi!');
                }
            },
            error: function () {
                hienThiLoi('Không thể gửi bình luận. Vui lòng thử lại!');
            }
        });
    },

    // Thêm trả lời mới
    submitTraLoi(maPH) {
        const textarea = $(`#replyInput-${maPH} textarea`);
        let noiDung = textarea.val().trim();
        if (kiemTraNoiDungRong(noiDung, 'Vui lòng nhập nội dung trả lời!')) return;

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
            url: '/Home/AddTraLoi',
            type: 'POST',
            data: {
                maPH: maPH,
                noiDungTL: noiDung,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    const replyList = $(`#replyList-${maPH}`);
                    replyList.html(data);
                    replyList.show();
                    $(`#replyInput-${maPH} textarea`).val("");
                    $(`#replyInput-${maPH}`).hide();
                    const viewLink = $(`.comment-item[data-maph='${maPH}'] .view-replies`);
                    const hideLink = $(`.comment-item[data-maph='${maPH}'] .hide-replies`);
                    let soLuongTraLoi = parseInt(viewLink.attr('data-so-luong-traloi') || 0) + 1;
                    if (viewLink.length === 0) {
                        const actions = $(`.comment-item[data-maph='${maPH}'] .comment-actions`);
                        actions.append(`<a class="view-replies" onclick="CommentManager.showReplies(${maPH})" data-maph="${maPH}" data-so-luong-traloi="${soLuongTraLoi}">Xem ${soLuongTraLoi} câu trả lời</a>`);
                        actions.append(`<a class="hide-replies" onclick="CommentManager.hideReplies(${maPH})" data-maph="${maPH}" style="display: inline;">Ẩn trả lời</a>`);
                        replyListStates[maPH] = true;
                    } else {
                        viewLink.attr('data-so-luong-traloi', soLuongTraLoi);
                        viewLink.text(`Xem ${soLuongTraLoi} câu trả lời`);
                        viewLink.hide();
                        hideLink.show();
                        replyListStates[maPH] = true;
                    }
                    hienThiThanhCong('Trả lời đã được gửi!');
                }
            },
            error: function () {
                hienThiLoi('Không thể gửi trả lời. Vui lòng thử lại!');
            }
        });
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////
   

   

   
    ////////////////////////////////////////////////////////////////////////////

    editPhanHoi(maPH) {
        const contentDiv = document.getElementById(`content-${maPH}`);
        const editInput = document.getElementById(`editInput-${maPH}`);
        contentDiv.style.display = "none";
        editInput.style.display = "block";
        const textarea = document.getElementById(`editInputText-${maPH}`);
        this.updateCharCount(`editInputText-${maPH}`, `editCharCount-${maPH}`, 500);
    },

    submitEditPhanHoi(maPH) {
        const noiDung = document.querySelector(`#editInput-${maPH} textarea`).value.trim();
        if (kiemTraNoiDungRong(noiDung, 'Vui lòng nhập nội dung bình luận!')) return;
        $.ajax({
            url: '/Home/EditPhanHoi',
            type: 'POST',
            data: {
                maPH: maPH,
                noiDungPH: noiDung,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                $("#phanHoiList").html(data);
               hienThiThanhCong('Bình luận đã được chỉnh sửa!');
            },
            error: function () {
                hienThiLoi('Không thể chỉnh sửa bình luận. Vui lòng thử lại!');
            }
        });
    },

    cancelEditPhanHoi(maPH) {
        const contentDiv = document.getElementById(`content-${maPH}`);
        const editInput = document.getElementById(`editInput-${maPH}`);
        contentDiv.style.display = "block";
        editInput.style.display = "none";
    },

    deletePhanHoi(maPH) {
        Swal.fire({
            icon: 'question',
            title: 'Xác nhận',
            text: 'Bạn có chắc muốn xóa bình luận này?',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/Home/DeletePhanHoi',
                    type: 'POST',
                    data: {
                        maPH: maPH,
                        '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (data, status, xhr) {
                        if (typeof data === 'object' && data.success === false) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi',
                                text: data.message || 'Không thể xóa bình luận. Vui lòng thử lại!',
                                confirmButtonText: 'Đóng'
                            });
                        } else {
                            $("#phanHoiList").html(data);
                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công',
                                text: 'Bình luận đã được xóa!',
                                confirmButtonText: 'Đóng'
                            });
                        }
                    },
                    error: function (xhr) {
                        if (xhr.status === 401 || xhr.status === 403) {
                            window.location.href = '/Identity/Account/Login?returnUrl=/Home/ChiTietSanPham';
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi',
                                text: 'Không thể xóa bình luận. Vui lòng thử lại!',
                                confirmButtonText: 'Đóng'
                            });
                        }
                    }
                });
            }
        });
    },
    /////////////////////////////////SUA-XOÁ TRẢ LỜI//////////////////////////////////////

    editTraLoi(maTL) {
        const contentDiv = document.getElementById(`reply-content-${maTL}`);
        const editInput = document.getElementById(`edit-reply-input-${maTL}`);
        const textarea = document.getElementById(`edit-reply-input-text-${maTL}`);

        // Gọi AJAX để lấy nội dung đã chuyển đổi
        $.ajax({
            url: '/Home/GetNoiDungForEdit',
            type: 'GET',
            data: { type: 'TraLoi', id: maTL },
            success: function (data) {
                if (data.success) {
                    textarea.value = data.noiDung;
                    contentDiv.style.display = "none";
                    editInput.style.display = "block";
                    CommentManager.updateCharCount(`edit-reply-input-text-${maTL}`, `edit-reply-char-count-${maTL}`, 500);
                } else {
                    hienThiLoi(data.message || 'Không thể tải nội dung chỉnh sửa.');
                }
            },
            error: function () {
                hienThiLoi('Không thể tải nội dung chỉnh sửa.');
            }
        });
    },

    submitEditTraLoi(maTL) {
        const noiDung = document.querySelector(`#edit-reply-input-${maTL} textarea`).value.trim();
        if (kiemTraNoiDungRong(noiDung, 'Chỉnh sửa không thể trống!')) return;

        $.ajax({
            url: '/Home/EditTraLoi',
            type: 'POST',
            data: {
                maTL: maTL,
                noiDungTL: noiDung,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (typeof data === 'object' && data.success === false) {
                    hienThiLoi('Không thể chỉnh sửa trả lời. Vui lòng thử lại!');
                } else {
                    const replyList = $(`.reply-list:has(.reply-item[data-matl='${maTL}'])`);
                    replyList.html(data);
                    hienThiThanhCong('Trả lời đã được chỉnh sửa!');
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    window.location.href = '/Identity/Account/Login?returnUrl=/Home/ChiTietSanPham';
                } else {
                    hienThiLoi('Không thể chỉnh sửa trả lời. Vui lòng thử lại!');
                }
            }
        });
    },

    cancelEditTraLoi(maTL) {
        const contentDiv = document.getElementById(`reply-content-${maTL}`);
        const editInput = document.getElementById(`edit-reply-input-${maTL}`);
        contentDiv.style.display = "block";
        editInput.style.display = "none";
    },

    deleteTraLoi(maTL) {
        Swal.fire({
            icon: 'question',
            title: 'Xác nhận',
            text: 'Bạn có chắc muốn xóa trả lời này?',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/Home/DeleteTraLoi',
                    type: 'POST',
                    data: {
                        maTL: maTL,
                        '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (data, status, xhr) {
                        if (typeof data === 'object' && data.success === false) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi',
                                text: data.message || 'Không thể xóa trả lời. Vui lòng thử lại!',
                                confirmButtonText: 'Đóng'
                            });
                        } else {
                            const replyList = $(`.reply-list:has(.reply-item[data-matl='${maTL}'])`);
                            replyList.html(data);
                            const count = replyList.find(".reply-item").length;
                            const viewLink = $(`.comment-item:has(.reply-list:has(.reply-item[data-matl='${maTL}'])) .view-replies`);
                            if (count > 0) {
                                viewLink.text(`Xem ${count} câu trả lời`);
                            } else {
                                viewLink.remove();
                            }
                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công',
                                text: 'Trả lời đã được xóa!',
                                confirmButtonText: 'Đóng'
                            });
                        }
                    },
                    error: function (xhr) {
                        if (xhr.status === 401 || xhr.status === 403) {
                            window.location.href = '/Identity/Account/Login?returnUrl=/Home/ChiTietSanPham';
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi',
                                text: 'Không thể xóa trả lời. Vui lòng thử lại!',
                                confirmButtonText: 'Đóng'
                            });
                        }
                    }
                });
            }
        });
    },

    ///////////////////////////////////////////////////////////////////


    likePhanHoi(maPH) {
        $.ajax({
            url: '/Home/LikePhanHoi',
            type: 'POST',
            data: {
                maPH: maPH,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                    window.location.href = data.redirect; // Chuyển hướng nếu chưa đăng nhập
                } else if (data.success) {
                    const likeLink = $(`.comment-item[data-maph='${maPH}'] .comment-actions .like-link`);
                    const likeCount = likeLink.find('.like-count');
                    likeLink.toggleClass('liked', data.daThich);
                    likeCount.text(data.soLuotThich > 0 ? data.soLuotThich : '');
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công',
                        text: data.daThich ? 'Đã thích bình luận!' : 'Đã bỏ thích bình luận!',
                        confirmButtonText: 'Đóng',
                        timer: 1500
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: data.message || 'Không thể thực hiện thao tác. Vui lòng thử lại!',
                        confirmButtonText: 'Đóng'
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Không thể thực hiện thao tác. Vui lòng thử lại!',
                    confirmButtonText: 'Đóng'
                });
            }
        });
    },

    likeTraLoi(maTL) {
        $.ajax({
            url: '/Home/LikeTraLoi',
            type: 'POST',
            data: {
                maTL: maTL,
                '__RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.redirect) {
                    window.location.href = data.redirect; // Chuyển hướng nếu chưa đăng nhập
                } else if (data.success) {
                    const likeLink = $(`.reply-item .like-link[data-matl='${maTL}']`);
                    const likeCount = likeLink.find('.like-count');
                    likeLink.toggleClass('liked', data.daThich);
                    likeCount.text(data.soLuotThich > 0 ? data.soLuotThich : '');
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công',
                        text: data.daThich ? 'Đã thích câu trả lời!' : 'Đã bỏ thích câu trả lời!',
                        confirmButtonText: 'Đóng',
                        timer: 1500
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: data.message || 'Không thể thực hiện thao tác. Vui lòng thử lại!',
                        confirmButtonText: 'Đóng'
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Không thể thực hiện thao tác. Vui lòng thử lại!',
                    confirmButtonText: 'Đóng'
                });
            }
        });
    },
    ///////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////-Phân Trang-///////////////////////////////////////
    taiThemPhanHoi(maSP, pageNumber) {
        taiThemDuLieu('/Home/GetPhanHoiByMaSP', 'maSP', maSP, pageNumber);
    },

    taiThemTraLoi(maPH, pageNumber) {
        taiThemDuLieu('/Home/GetTraLoiByMaPH', 'maPH', maPH, pageNumber);
    },

    /////////////////////////////////////////////////////////////////////
 
    updateCharCount(inputId, countId, maxLength) {
        const input = document.getElementById(inputId);
        const countSpan = document.getElementById(countId);
        const remaining = maxLength - input.value.length;
        countSpan.textContent = `Còn ${remaining} ký tự`;
    }
};



// Hàm kiểm tra nội dung rỗng và hiển thị cảnh báo
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


$(document).ready(function () {
    CommentManager.truncateCommentContent();
});