#!/bin/bash
KEY_DIR=~/.ssh/id_rsa_ci

mkdir -p ~/.ssh/
export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no"

#git reset
#rm -rf .git/
#git init -b main

base64 -d <<<$SSH_PUSH_KEY_BASE64 >$KEY_DIR
chmod 600 "$KEY_DIR"
git config user.email "ci@example.com"
git config user.name "CI"
git remote remove ssh_origin || true
git remote add ssh_origin "git@$CI_SERVER_HOST:$CI_PROJECT_PATH.git"
git add ./flag
git gc --aggressive --prune=now
git commit -m "CI commit [skip ci]"

#main push
bitbucker(){
    ssh-add "$KEY_DIR"
    echo "Host bitbucket.org
    IdentityFile $KEY_DIR
" > ~/.ssh/config
    git push -u ssh_origin main #-f

    sh/artifact.sh upload
}

gitlab(){
    git push ssh_origin HEAD:$CI_COMMIT_REF_NAME
}
#end main

case $CI_SERVER_HOST in
    bitbucket.org)
        bitbucker;;
    gitlab.com)
        gitlab;;
esac

rm ~/.ssh/*