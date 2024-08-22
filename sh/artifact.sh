#!/bin/sh -e

[ "$1" = upload ] && \
    curl -sX POST \
    -H "Authorization: Bearer $ARTIFACT_TK" \
    "https://api.bitbucket.org/2.0/repositories/${BB_WORKSPACE}/${BB_REPO_SLUG}/downloads" \
    -F files=@/tmp/storage.7z \
||  curl -sL -H "Authorization: Bearer $ARTIFACT_TK" \
    https://api.bitbucket.org/2.0/repositories/${BB_WORKSPACE}/${BB_REPO_SLUG}/downloads/storage.7z -o /tmp/storage.7z
