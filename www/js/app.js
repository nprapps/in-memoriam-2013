var $b;
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
var $slide_list_end;
var $slide_browse_btn;
var $titlecard;
var $panels;
var $panel_images;
var $full_screen_button;

var active_slide = 0;

var audio_supported = false;
if (Modernizr.audio) {
    audio_supported = true;
}

var end_id;
var end_cue;
var mobile_breakpoint = 767;
var num_slides;
var pop;

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
    var slide_html = '';
    var audio_html = '';
    var browse_html = '';
    var end_list_html = '';

    _.each(PEOPLE, function(person, index, list){
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
        end_list_html += JST.endlist({ artist: person });

    });

    $titlecard.after(slide_html);
    $('#send').before(audio_html);
    $slide_list_end.append(end_list_html);

    // rename the closing slides with the correct ID numbers
    end_id = num_slides - 1;
    end_cue = AUDIO_LENGTH - 30;

    if (audio_supported) {
        pop.code({
            start: 0,
            end: 0.5,
            onStart: function( options ) {
                scroll_to_slide(0);
                return false;
            },
            onEnd: function( options ) {}
        });
        pop.code({
            start: end_cue,
            end: end_cue + 0.5,
            onStart: function( options ) {
                scroll_to_slide(end_id);
                return false;
            },
            onEnd: function( options ) {}
        });
    }

    $('#send').attr('id','s' + end_id);
    $('#s' + end_id).attr('data-id', end_id);
    $('#s' + end_id).css('left',((end_cue / AUDIO_LENGTH) * 100) + '%');
    $('#panelend').attr('id','panel' + end_id);

    $slide_nav.find('.slide-nav-item').hover(function() {
        var id = parseInt($(this).attr('data-id'), 0);
    }, function() {
        var id = parseInt($(this).attr('data-id'), 0);
    });

    $slide_nav.find('.slide-nav-item').on('click', function() {
        var id = parseInt($(this).attr('data-id'), 0);
        goto_slide(id);
    });

    $slide_list_end.find('a.slidelink').on('click', function() {
        var id = parseInt($(this).attr('data-id'), 0);
        goto_slide(id);
    });

    $slide_browse_btn.on('click', function() {
        goto_slide(end_id);
    });

    $panels = $slide_wrap.find('.panel');
    $panel_images = $panels.find('.panel-bg');

    goto_slide(0);

    resize_slideshow();
};

var goto_slide = function(id) {
    /*
     * Determine whether to shift to the next slide
     * with audio, or without audio.
     */
    active_slide = Number(id);
    if (!audio_supported || $player.data().jPlayer.status.paused) {
        scroll_to_slide(id);
        if (PEOPLE[id-1] !== undefined) {
            $player.jPlayer('pause', PEOPLE[id-1]['start_time_in_mix']);
        } else if (id == end_id) {
            $player.jPlayer('pause', end_cue);
        } else if (id === 0) {
            $player.jPlayer('pause', 0);
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
        if (PEOPLE[id-1] !== undefined) {
            $player.jPlayer('play', PEOPLE[id-1]['start_time_in_mix']);
        } else if (id == end_id) {
            $player.jPlayer('play', end_cue);
        } else if (id === 0) {
            $player.jPlayer('pause', 0);
        }
    } else {
        scroll_to_slide(id);
    }
};

var scroll_to_slide = function(id) {
    /*
     * Scroll horizontally to the correct slide position.
     */

    // play_slide() doesn't get called during the long-playing of the file.
    // scroll_to_slide() does get called.
    // Track start/finish of a slide.

    // Don't say we started the zero-th slide.
    if (parseInt(id, 0) > 0) {
        _gaq.push(['_trackEvent', 'Audio', 'Started Artist', APP_CONFIG.PROJECT_NAME, id]);
    }

    // Don't say we completed the zero-th slide.
    if (parseInt((id-1), 0) > 0) {
        _gaq.push(['_trackEvent', 'Audio', 'Completed Artist', APP_CONFIG.PROJECT_NAME, id-1]);
    }

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

    // show/hide nav where appropriate
    $b.removeClass().addClass('slide' + id);

    if(id !== 0 && !$audio_nav.hasClass('fadeIn')) {
        $audio_nav.addClass('animated fadeIn');
    } else if (id === 0) {
        $audio_nav.removeClass('animated fadeIn');
    }

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

var handle_full_screen = function(element) {
    var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) {
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") {
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
};

var resize_slideshow = function() {
    /*
     * Resize slideshow panels based on screen width
     */
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
    $panels.width(new_width + 'px').height(new_height + 'px');
    $slide_wrap.width((num_slides * new_width) + 'px').height(new_height + 'px');
    $titlecard.height(new_height + 'px');

    if (new_width <= mobile_breakpoint) {
        $panel_images.height((Math.ceil(new_width * 9) / 16) + 'px');
    } else {
        $panel_images.height('100%');
    }

    // reset slide position
    scroll_to_slide(active_slide);
};

$(document).ready(function() {
    num_slides = PEOPLE.length + 2;

    $b = $('body');
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
    $slide_list_end = $('#list-nav-end');
    $slide_browse_btn = $('#browse-btn');
    $titlecard = $('#panel0');
    $full_screen_button = $('#full-screen');

    if (!audio_supported) { $audio.hide(); }

    if (audio_supported) {
        /*
         * Load audio player
         */
        $player.jPlayer({
            ready: function () {
                $(this).jPlayer('setMedia', {
                    oga: APP_CONFIG.OGG_LINK,
                    mp3: APP_CONFIG.MP3_LINK
                }).jPlayer('pause');
            },
            play: function() { // To avoid both jPlayers playing together.
                $(this).jPlayer('pauseOthers');
            },
            ended: function (event) {
                $(this).jPlayer('pause');
            },
            swfPath: 'js/lib',
            supplied: 'oga, mp3'
        });

        pop = Popcorn('#jp_audio_0');
    }

    $(window).on('resize', resize_slideshow);

    $('#title-button').on('click', function() {
        if (audio_supported) {
            $player.jPlayer('play');
            _gaq.push(['_trackEvent', 'Audio', 'Started The Audio', APP_CONFIG.PROJECT_NAME, 0]);
        } else {
            goto_slide(1);
        }
    });

    $next.on('click', goto_next_slide);

    $back.on('click', goto_previous_slide);

    $(document).on('keydown', function(ev) { handle_keypress(ev); });

    $full_screen_button.on('click', handle_full_screen(document.body));

    $audio_branding.on('click', function() {
        if (audio_supported) {
            $player.jPlayer('stop');
        }
        goto_slide(0);
    });

    load_slideshow_data();
});