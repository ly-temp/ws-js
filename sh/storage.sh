#!/bin/bash
case $1 in
    encrypt)
        rm -f /tmp/storage.7z
        7z a /tmp/storage.7z /tmp/storage -p"$PW"
        rm -r /tmp/storage
    ;;
    decrypt)
        7z x /tmp/storage.7z -p"$PW" -o/tmp
    ;;
esac
