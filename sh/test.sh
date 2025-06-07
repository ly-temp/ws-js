#!/bin/bash
apt update && apt install -y openssh-client git p7zip-full 
mkdir -p storage
date > storage/log.txt
sh/storage.sh encrypt

sh/commit.sh