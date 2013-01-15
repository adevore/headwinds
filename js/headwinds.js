"use strict";
/**
 * Implementation of the Headwinds protocol
 * 
 * Notes:
 * - `cookie` refers to a Headwinds cookie, not an HTTP cookie
 */

// Adjust jlint to not apply some odd rules.
/*jslint white:true */

// Give puzzles a unique ID. More dependable than Math.random.
var headwindsNextPuzzleID = 0;
var resolveCallback, puzzleLoop;

/**
 * Run the entire submission process.
 * 
 * The callbacks argument takes an object with that contains:
 * - fetchingCookie(): cookie fetching has started [optional]
 * - fetchingPuzzles(): puzzle fetching has started [optional]
 * - solving(): puzzle solving is in progress, called for each puzzle. [optional]
 * - error(msg): On any error
 * - completed(cookie): Success. Pass the cookie to the web app.
 * 
 * The urls object must include:
 * - cookieURL: Initial cookie fetching URL [web app]
 * - headwindsURL: Initial puzzle URL [headwinds]
 * - nextPuzzleURL: Verify puzzle URL, possibly get a new puzzle [headwinds]
 * 
 * @param msg: message text
 * @param author: author text
 * @param email: author email
 * @param author_url: author url (empty string if DNE)
 * @param urls: see above
 * @param callbacks: see above
 */
function submit(json, urls, callbacks) {
    // Get the initial response from the web app server
    var request = $.ajax({
        beforeSend: function (xhr) {
            xhr.setRequestHeader("If-Modified-Since", "0");
            resolveCallback(callbacks.fetchingCookie)();
        },
        type: "POST",
        url: urls.cookie,
        data: json,
        dataType: "json"
    });

    // 
    request.done(function (cookie) {
        request = $.ajax({
            beforeSend: function (xhr) {
                xhr.setRequestHeader("If-Modified-Since", "0");
                resolveCallback(callbacks.fetchPuzzles)();
            },
            type: "POST",
            url: urls.headwindsURL,
            data: "message=" + JSON.stringify(cookie),
            dataType: "jsonp"
        });
        request.done(function (cookie) {
            puzzleLoop(cookie, cookie.score, cookie.ts, callbacks, urls);
        });
    });
}

/**
 * Internal function. Core puzzle request/solve
 * 
 * @param cookie: initial headwinds cookie from the web app
 * @param callbacks: The callback object from submit
 * @param urls: The urls object from submit
 */
function puzzleLoop(cookie, score, timestamp, callbacks, urls) {
    var uid = cookie.uid;
    // Forward declare JavaScript functions so they are part of each other's
    // closures.
    var puzzleReceived, puzzleFinished;
    
    // Dispatch responses from the Headwinds server
    function responseHandler(cookie) {
        if(cookie.result === "success") {
            if(cookie.type === "puzzle") {
                puzzleReceived(cookie);
            }
            else if(cookie.type === "done") {
                callbacks.complete(cookie);
            }
            else {
                callbacks.error("Invalid result from Headwinds server");
            }
        } else {
            callbacks.error("non-success value from Headwinds server");
        }
    }

    // Process a puzzle response from HW server
    puzzleReceived = function(cookie) {
        resolveCallback(callbacks.solving)();

        // Insert the puzzle JavaScript into a script tag
        // Can this be done via eval() ?
        var id = "puzzle" + headwindsNextPuzzleID;
        headwindsNextPuzzleID += 1;
        $("body").append('<script id="' + id + '" type="text/javascript">'
                            + cookie.content.content +
                         '</script>');
        $("#" + id).ready(function() {
            // TODO: Is `id = new` needed?
            id = new Solve({
                id: id,
                tag: {
                    AA: cookie.content[3],
                    NN: cookie.content[2],
                    TT: cookie.content[1]
                },
                callback: puzzleFinished
            });
        });
    };

    // Send the answer to the Headwinds server
    puzzleFinished = function(answer) {
        $.ajax({
            url: urls.verify,
            dataType: "jsonp",
            data: {
                answer: answer,
                uid: uid
            },
            type: "POST",
            success: responseHandler,
        });
    };

    // Start out with the initial cookie from submit(...)
    responseHandler(cookie);
}

/*
 * Internal utility function
 *
 * Resolve a callback that may or may not have been attached to an
 * object. If it exist, return it. Otherwise, return an empty function.
 */
function resolveCallback(callback) {
    if(callback === null) {
        return function() {};
    } else {
        return callback;
    }
}
