#init only, no start
COPY files/init.sh /tmp/init.sh #buildkit
RUN /bin/sh -c chmod +x /tmp/init.sh && /tmp/init.sh && rm /tmp/init.sh # buildkit
