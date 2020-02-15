FROM mysql:5.7

ADD my.cnf /etc/mysql/my.cnf
ADD init.d/init.sql /docker-entrypoint-initdb.d
ADD init.d/init.sql /tmp

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["mysqld"]
