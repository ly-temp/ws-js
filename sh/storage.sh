#!/bin/sh -e
case $1 in
    encrypt)
        rm -f /tmp/storage.7z
        7z a /tmp/storage.7z /tmp/storage -p"$ZIP_PASS"
        rm -r /tmp/storage
    ;;
    decrypt)
        7z x /tmp/storage.7z -p"$ZIP_PASS" -o/tmp
    ;;
esac
