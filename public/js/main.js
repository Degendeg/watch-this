$(document).ready(function() {
    $('.modal').modal();

    $('#username-dialog').modal({
        dismissible: false,
    });
	
    $('#username-dialog').modal('open');

	$('#username-input').on('input', function() {
		$(this).val($(this).val().replace(/[^a-z0-9]/gi, ''));
	});
	
    $('#search-input').keypress((e) => {
		if (e.which === 13) { // Enter
			e.preventDefault();

			const searchInput = $('#search-input').val();
			if (searchInput.length == 0) {
				return;
			}
			player.loadVideoById(searchInput);

			setTimeout(() => {
				changeVideoInformation();
			}, 2000);
		}
    });
});