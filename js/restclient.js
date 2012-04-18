$(function() {
	
	var viewScreenshot = function() {
		var html = '<a href="' + this.url + '" title="' + $(this).attr('alt') + '">&nbsp;</a>';
		$(html).fancybox().trigger('click');
	};

	var instanceOne = new ImageFlow();
	instanceOne.init({ 
		ImageFlowID: 'nostos_imageflow', 
		onClick: viewScreenshot, 
		captions: true,
		aspectRatio: 2.8, 
		startID: 4, 
		imagesHeight: 0.5,
		imageCursor: 'pointer',
		sliderCursor: 'pointer',
		percentLandscape: 100,
		scrollbarP: 0.6,
		xStep: 110,
		imageFocusMax: 3,
		preloadImages: false,
		reflections: false,
		reflectionGET: '&bgc=ffffff&fade_start=50%&height=30%'
	});
});