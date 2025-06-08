#!/bin/bash

TK="$S3_TOKEN"
B="$S3_BASE_URL"
REG_SER="$S3_REGION"

OPT=(-H 'x-amz-content-sha256: UNSIGNED-PAYLOAD')
fnameEncode=ws-js.storage.7z
file=./storage.7z

s3Put(){
        id=$(curl -sL -X PUT "$B/$fnameEncode" \
        --aws-sigv4 "aws:amz:$REG_SER" \
        --user "$TK" \
        --data-binary @"$file" \
        -w '%header{x-amz-version-id}' "${OPT[@]}")
        [ -n "$BPub" ]&&B=$BPub
        echo -n "$B/$fnameEncode?versionId=$id"
}

s3Get(){
	res=$(curl -gs -D- -L "$B/$fnameEncode" \
    --aws-sigv4 "aws:amz:$REG_SER" \
    --user "$TK" \
        "${OPT[@]}" \
        -o "$file")
	head -n1 <<<$res
}


case $1 in
    upload) s3Put;;
    download) s3Get;;
esac
