#init only, no start
FROM debian
COPY sh/init.sh /tmp/init.sh
RUN chmod +x /tmp/init.sh && /tmp/init.sh && rm /tmp/init.sh
