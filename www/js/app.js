var $main_content;
var $s;
var $slide_wrap;
var $slide_nav;
var $next;
var $back;
var $audio_nav;
var $audio_branding;
var $audio;
var $progress;
var $player;
var $slide_list;
var $slide_list_end;
var $slide_browse_btn;
var $titlecard;
var $panels;
var $panel_images;

var active_slide = 0;
var audio_length = 390;
var num_slides;
var slideshow_data = [];
var pop;
var audio_supported = !($.browser.msie === true && $.browser.version < 9);
var slide_list_open = false;

var slide_list_toggle = function(mode) {
    if (slide_list_open || mode == 'close') {
        $slide_list.hide();
        $slide_browse_btn.removeClass('active');
        slide_list_open = false;
    } else if (!slide_list_open || mode == 'open') {
        $slide_list.show();
        $slide_browse_btn.addClass('active');
        slide_list_open = true;
    }
};

var ap_date = function(mmnt) {
    /*
     * Hacky AP date-formatter for moment().
     */
    var out = mmnt.format('MMM');

    if (mmnt.month() == 4) {
        // May
    } else if (mmnt.month() == 5) {
        out = 'June';
    } else if (mmnt.month() == 6) {
        out = 'July';
    } else if (mmnt.month() == 8) {
        out = 'Sept.';
    } else {
        out += '.';
    }

    out += ' ' + mmnt.format('D, YYYY');

    return out;
};

// AAAAA RADIOACTIVE
var goto_slide = function(id) {
    /*
     * Determine whether to shift to the next slide
     * with audio, or without audio.
     */

    //
    // The data is structured differently this year, e.g., not indexed by ID.
    // URLP.
    //
    console.log('goto_slide(' + id + ')');
    active_slide = Number(id);
    if (!audio_supported || $player.data().jPlayer.status.paused || slideshow_data[id] === undefined) { // slideshow_data structure is different.
        scroll_to_slide(id);
        if (slideshow_data[id] !== undefined) {
            $player.jPlayer('pause', slideshow_data[id]['cue_start']);
        } else if (id == (num_slides - 1)) {
            $player.jPlayer('pause', audio_length);
        }
    } else {
        play_slide(id);
    }

    return false;
};

var play_slide = function(id) {
    /*
     * Play a slide at the correct audio cue.
     */

    //
    // The data is structured differently this year, e.g., not indexed by ID.
    // URLP.
    //

    if (audio_supported) {
        $player.jPlayer('play', slideshow_data[id]['cue_start']); // slideshow_data structure is different.
    } else {
        scroll_to_slide(id);
    }
};

var load_slideshow_data = function() {
    /*
     * Load slideshow data from external JSON
     */
    var slide_output = '';
    var audio_output = '';
    var browse_output = '';
    var endlist_output = '';

    _.each(PEOPLE, function(person, index, list){

        person['id'] = index + 1;

        person.position = (person.cue_start / audio_length) * 100;

        if ($main_content.width() <= 480) {
            person['image_width'] = 480;
        } else if ($main_content.width() <= 979) {
            person['image_width'] = 979;
        } else {
            person['image_width'] = 1200;
        }

        if (person.date_of_birth !== '') {
            person.date_of_birth = ap_date(moment(person.date_of_birth, 'MM DD YYYY'));
            person.date_of_death = ap_date(moment(person.date_of_death, 'MM DD YYYY'));
        }

        if (audio_supported) {
            if (person['id'] === 0) {
                person.start_time_in_mix += 1;
            }

            pop.code({
                start: person.start_time_in_mix,
                end: person.start_time_in_mix + 0.5,
                onStart: function( options ) {
                    scroll_to_slide(person['id'] + 1);
                    return false;
                },
                onEnd: function( options ) {}
            });
        }

        slide_output += JST.slide({ artist: person });
        audio_output += JST.slidenav({ artist: person });
        browse_output += JST.browse({ artist: person });
        endlist_output += JST.endlist({ artist: person });

    });


    $titlecard.after(slide_output);
    $('#send').before(audio_output);

    // // rename the closing slides with the correct ID numbers
    // var end_id = num_slides-1;
    // var end_cue = audio_length - 30;
    // $('#send').attr('id','s' + end_id);
    // $('#s' + end_id).attr('data-id', end_id);
    // $('#s' + end_id).css('left',((end_cue / audio_length) * 100) + '%');
    // $('#panelend').attr('id','panel' + end_id);
    // slideshow_data.push({
    //         id: end_id,
    //         cue_start: end_cue
    // });

};

var resize_slideshow = function() {
    /*
     * Resize slideshow panels based on screen width
     */
    var new_width = $main_content.width();
    var new_height = $(window).height() - $audio.height();
    var height_43 = Math.ceil(($main_content.width() * 3) / 4);

    if (new_width <= 480) {
        new_height = 600;
    } else if (new_height > height_43) {
        // image ratio can go no larger than 4:3
        new_height = height_43;
    }

    $s.width(new_width + 'px').height(new_height + 'px');
    $slide_wrap.width((num_slides * new_width) + 'px').height(new_height + 'px');
    $panels.width(new_width + 'px').height(new_height + 'px');
    $titlecard.height(new_height + 'px');

    if (new_width <= 480) {
        $panel_images.height((Math.ceil(new_width * 9) / 16) + 'px');
    } else {
        $panel_images.height('100%');
    }

    if (new_width <= 767) {
        $('#next-btn').html('&gt;');
        $('#back-btn').html('&lt;');
    } else {
        $('#next-btn').html('Next&nbsp;&gt;');
        $('#back-btn').html('&lt;&nbsp;Back');
    }

    // reset navbar position
    var navpos = $audio_nav.position;
    $slide_list.css('top',navpos.top + $audio_nav.height());

    // reset slide position
    scroll_to_slide(active_slide);
};

var scroll_to_slide = function(id) {
    /*
     * Scroll horizontally to the correct slide position.
     */
    console.log('scroll_to_slide(' + id + ')');
    slide_list_toggle('close');

    $.smoothScroll({
        direction: 'left',
        scrollElement: $s,
        scrollTarget: '#panel' + id,
        afterScroll: function() {
            $slide_nav.find('li').removeClass('active');
            $slide_nav.find('#s' + id).addClass('active');
        }
    });
    active_slide = id;

    return false;
};

var goto_next_slide = function() {
    if (active_slide < (num_slides-1)) {
        var id = active_slide + 1;
        goto_slide(id);
    }
    return false;
};

var goto_previous_slide = function() {
    if (active_slide > 0) {
        var id = active_slide - 1;
        goto_slide(id);
    }
    return false;
};

var handle_keypress = function(ev) {
    if (ev.which == 37) {
        goto_previous_slide();
    } else if (ev.which == 39) {
        goto_next_slide();
    } else if (ev.which == 32 && audio_supported) {
        if ($player.data().jPlayer.status.paused) {
            $player.jPlayer('play');
        } else {
            $player.jPlayer('pause');
        }
    }
    return false;
};

$(document).ready(function() {
    num_slides = PEOPLE.length + 2;

    $main_content = $('#main-content');
    $s = $('#slideshow');
    $slide_wrap = $('#slideshow-wrap');
    $slide_nav = $('#slide-nav');
    $next = $('#next-btn');
    $back = $('#back-btn');
    $audio_nav = $('#audio-navbar');
    $audio_branding = $audio_nav.find('.branding');
    $audio = $('#audio');
    $progress = $audio.find('.jp-progress-container');
    $player = $('#pop-audio');
    $slide_list = $('#list-nav');
    $slide_list_end = $('#list-nav-end');
    $slide_browse_btn = $('#browse-btn');
    $titlecard = $('#panel0');

    if (!audio_supported) { $audio.hide(); }

    slide_list_toggle('close');

    if (audio_supported) {
        /*
         * Load audio player
         */
        $player.jPlayer({
            ready: function () {
                $(this).jPlayer('setMedia', {
                    mp3: "http://apps.npr.org/music-memoriam-2012/audio/artists2012.mp3",
                    oga: "http://apps.npr.org/music-memoriam-2012/audio/artists2012.ogg"
                }).jPlayer("pause");
            },
            play: function() { // To avoid both jPlayers playing together.
                $(this).jPlayer("pauseOthers");
            },
            ended: function (event) {
                $(this).jPlayer("pause");
            },
            swfPath: "js",
            supplied: "oga, mp3"
    //      ,errorAlerts:true
        });
        // associate jPlayer with Popcorn
        pop = Popcorn('#jp_audio_0');
    }

    $(window).on('resize', resize_slideshow);

    $('#title-button').on('click', function() { play_slide(1); });

    $slide_browse_btn.on('click', function(e){ slide_list_toggle(); });

    $slide_nav.on('mouseenter', function(e){ slide_list_toggle('open'); });

    $slide_list.on('mouseleave', function(e){ slide_list_toggle('close'); });

    $next.on('click', goto_next_slide);

    $back.on('click', goto_previous_slide);

    $(document).on('keydown', function(ev) { handle_keypress(ev); });

    $audio_branding.on('click', function() {
        if (audio_supported) {
            $player.jPlayer('stop');
        }
        goto_slide(0);
    });

    load_slideshow_data();

});