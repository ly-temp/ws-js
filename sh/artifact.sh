#!/bin/bash

bitbucket(){
    WORKSPACE=lytemp
    REPO_SLUG=ws-js

    [ "$1" == upload ] && \
        curl -sX POST \
        -H "Authorization: Bearer $ARTIFACT_TK" \
        "https://api.bitbucket.org/2.0/repositories/${WORKSPACE}/${REPO_SLUG}/downloads" \
        -F files=@storage.7z \
    ||  curl -sL -H "Authorization: Bearer $ARTIFACT_TK" \
        https://api.bitbucket.org/2.0/repositories/${WORKSPACE}/${REPO_SLUG}/downloads/storage.7z -OJ
}
gitlab(){
    return 1
}

case "$CI_SERVER_HOST" in
    bitbucket.org)
        bitbucket "$1";;
    gitlab.com)
        gitlab "$1";;
esac