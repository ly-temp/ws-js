#!/bin/bash
case $1 in
    encrypt)
        rm storage.7z
        7z a storage.7z /tmp/storage -p"$PW"
        rm -r /tmp/storage
    ;;
    decrypt)
        7z x storage.7z -p"$PW" -o/tmp
    ;;
esac
