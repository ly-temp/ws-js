#!/bin/bash

startNode(){
    JS_MAIN_DIR=$(realpath js/main.js)
    (cd /tmp && node "$JS_MAIN_DIR" "$1")
}

: ${MODE:=bot}

mkdir -p /tmp/storage
sh/artifact.sh download
case $MODE in
    login)
        rm -f flag/login
        #sh/storage.sh decrypt
        startNode login
        sh/storage.sh encrypt
        sh/artifact.sh upload
        ;;
    list)
        sh/storage.sh decrypt
        #rm flag/list
        startNode list
        sh/artifact.sh upload
        ;;
    bot)
        sh/storage.sh decrypt
        startNode bot
        sh/storage.sh encrypt
        sh/artifact.sh upload
        ;;
esac
