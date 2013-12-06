var $content;
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

var audio_supported = false;
//if (Modernizr.audio.mp3 == 'probably' || Modernizr.audio.ogg  == 'probably') {
    audio_supported = true;
//}

var mobile_breakpoint = 767;
var num_slides;
var pop;
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

var load_slideshow_data = function() {
    /*
     * Load slideshow data from external JSON
     */
    console.log('load_slideshow_data()');

    var slide_html = '';
    var audio_html = '';
    var browse_html = '';
    var end_list_html = '';

    _.each(PEOPLE, function(person, index, list){
//        person['id'] = index;
        person['id'] = index + 1;

        person.position = parseInt((person.start_time_in_mix / AUDIO_LENGTH) * 100, 0);

        if ($content.width() <= 480) {
            person['image_width'] = 480;
        } else if ($content.width() <= 979) {
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
                    scroll_to_slide(person['id']);
                    return false;
                },
                onEnd: function( options ) {}
            });
        }

        slide_html += JST.slide({ artist: person });
        audio_html += JST.slidenav({ artist: person });
        browse_html += JST.browse({ artist: person });
        end_list_html += JST.endlist({ artist: person });

    });

    $titlecard.after(slide_html);
    $('#send').before(audio_html);
    $slide_list_end.append(end_list_html);

    $slide_list.append(browse_html);

    $slide_list.append(JST.browse({ artist: {
        'id': num_slides - 1,
        'photo_filename': null,
        'first_name': '',
        'last_name': 'Index & Credits'
    }}));

    // rename the closing slides with the correct ID numbers
    var end_id = PEOPLE.length + 1;
    var end_cue = AUDIO_LENGTH - 30;

    $('#send').attr('id','s' + end_id);
    $('#s' + end_id).attr('data-id', end_id);
    $('#s' + end_id).css('left',((end_cue / AUDIO_LENGTH) * 100) + '%');
    $('#panelend').attr('id','panel' + end_id);

    $slide_nav.find('.slide-nav-item').hover(function() {
        var id = parseInt($(this).attr('data-id'), 0);
        $slide_list.find('a[data-id="' + id + '"]').addClass('active');
    }, function() {
        var id = parseInt($(this).attr('data-id'), 0);
        $slide_list.find('a[data-id="' + id + '"]').removeClass('active');
    });

    $slide_nav.find('.slide-nav-item').on('click', function() {
        var id = parseInt($(this).attr('data-id'), 0);
        goto_slide(id);
    });

    $slide_list.find('a').on('click', function() {
        var id = parseInt($(this).attr('data-id'), 0);
        goto_slide(id);
        slide_list_toggle('close');
    });

    $slide_list.find('a').hover(function() {
        var id = parseInt($(this).attr('data-id'), 0);
        $slide_nav.find('.slide-nav-item[data-id="' + id + '"]').addClass('active');
    }, function() {
        var id = parseInt($(this).attr('data-id'), 0);
        $slide_nav.find('.slide-nav-item[data-id="' + id + '"]').removeClass('active');
    });

    $slide_list_end.find('a.slidelink').on('click', function() {
        var id = parseInt($(this).attr('data-id'), 0);
        goto_slide(id);
    });

    $panels = $slide_wrap.find('.panel');
    $panel_images = $panels.find('.panel-bg');

    resize_slideshow();
};

var goto_slide = function(id) {
    /*
     * Determine whether to shift to the next slide
     * with audio, or without audio.
     */
    console.log('goto_slide(' + id + ')');
    active_slide = Number(id);
    if (!audio_supported || $player.data().jPlayer.status.paused || PEOPLE[id] === undefined) {
        scroll_to_slide(id);
        if (PEOPLE[id] !== undefined) {
            $player.jPlayer('pause', PEOPLE[id]['start_time_in_mix']);
        } else if (id == (num_slides - 1)) {
            $player.jPlayer('pause', AUDIO_LENGTH);
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
    if (audio_supported) {
        var cuepoint = PEOPLE[id]['start_time_in_mix'];
        console.log('play cuepoint: ' + PEOPLE[id]['start_time_in_mix']);
        $player.jPlayer('play', PEOPLE[id]['start_time_in_mix']);
    } else {
        scroll_to_slide(id);
    }
};

var resize_slideshow = function() {
    /*
     * Resize slideshow panels based on screen width
     */
    console.log('resize_slideshow()');
    var new_width = $content.width();
    var new_height = $(window).height() - $audio.height();
    var height_43 = Math.ceil(($content.width() * 3) / 4);

    if (new_width <= mobile_breakpoint) {
        new_height = 1000;
    } else if (new_height > height_43) {
        // image ratio can go no larger than 4:3
        new_height = height_43;
    }

    $s.width(new_width + 'px').height(new_height + 'px');
    $panels.width((new_width - 2) + 'px').height(new_height + 'px');
    console.log(new_width);
    $slide_wrap.width((num_slides * new_width) + 'px').height(new_height + 'px');
    $titlecard.height(new_height + 'px');

    if (new_width <= mobile_breakpoint) {
        $panel_images.height((Math.ceil(new_width * 9) / 16) + 'px');
    } else {
        $panel_images.height('100%');
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
    if (active_slide < (num_slides - 1)) {
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
        return false;
    } else if (ev.which == 39) {
        goto_next_slide();
        return false;
    } else if (ev.which == 32 && audio_supported) {
        if ($player.data().jPlayer.status.paused) {
            $player.jPlayer('play');
        } else {
            $player.jPlayer('pause');
        }
        return false;
    }
    return true;
};

$(document).ready(function() {
    num_slides = PEOPLE.length + 2;

    $content = $('#content');
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
                    oga: "http://stage-apps.npr.org/music-memoriam-2013/audio/in-memoriam.ogg",
                    mp3: "http://stage-apps.npr.org/music-memoriam-2013/audio/in-memoriam.mp3"
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
        });

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