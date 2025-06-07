#!/bin/sh -e

startNode(){
    JS_MAIN_DIR=$(realpath js/main.mjs)
    (cd /tmp && node "$JS_MAIN_DIR" "$1")
}

: ${MODE:=bot}

mkdir -p /tmp/storage
case $MODE in
    login)
        #sh/storage.sh decrypt
        startNode login
        sh/storage.sh encrypt
        sh/artifact.sh upload
        ;;
    list)
        sh/artifact.sh download
        sh/storage.sh decrypt
        #rm flag/list
        startNode list
        sh/artifact.sh upload
        ;;
    bot)
        sh/artifact.sh download
        sh/storage.sh decrypt
        startNode bot
        sh/storage.sh encrypt
        sh/artifact.sh upload
        ;;
esac
