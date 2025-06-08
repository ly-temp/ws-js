#!/bin/bash
KEY_DIR=~/.ssh/id_rsa_ci
GIT_DIR=/tmp/storage_git

rm -rf "$GIT_DIR"
mkdir -p "$GIT_DIR"
cd "$GIT_DIR"

mkdir -p ~/.ssh/
export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no"

base64 -d <<<$SSH_PUSH_KEY_BASE64 >$KEY_DIR
chmod 600 "$KEY_DIR"

ssh-add "$KEY_DIR"
echo "Host gitea.com
    IdentityFile $KEY_DIR
" > ~/.ssh/config

case $1 in
    upload)
        mv /tmp/storage.7z .

        rm -rf .git/
        git init -b main

        git config user.email "ci@example.com"
        git config user.name "CI"
        git remote remove ssh_origin || true
        git remote add ssh_origin "$GIT_REPO_ORIGIN"
        git add .
        git gc --aggressive --prune=now
        git commit -m "CI commit [skip ci]"
        git push -u ssh_origin main -f
    ;;
    download)
        git clone "$GIT_REPO_ORIGIN"
        cd "$(ls|head -n1)"
        mv ./storage.7z /tmp/
    ;;
esac

rm ~/.ssh/*