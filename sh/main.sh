#!/bin/bash

startNode(){
    JS_MAIN_DIR=$(realpath js/main.js)
    (cd /tmp && node "$JS_MAIN_DIR" "$1")
}
getMode(){
    [ -n "$1" ] &&{ echo -n "$1";return; }
    for f in {"login","list","bot"};do
        [ -f "flag/$f" ] &&echo -n "$f" &&return
    done
    echo -n bot
}

mkdir -p /tmp/storage
sh/artifact.sh download
case $(getMode "$MODE") in
    login)
        rm -f flag/login
        #sh/storage.sh decrypt
        startNode login
        sh/storage.sh encrypt
        sh/commit.sh
        ;;
    list)
        sh/storage.sh decrypt
        rm flag/list
        startNode list
        sh/commit.sh
        ;;
    bot)
        sh/storage.sh decrypt
        startNode bot
        sh/storage.sh encrypt
        sh/commit.sh
        ;;
esac
