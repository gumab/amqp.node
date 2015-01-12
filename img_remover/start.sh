#!/bin/bash
#forever start -l /root/.forever/img_remover.log -a cluster.js

result=`forever list | grep cluster.js`
#if [ "$result" ] 
#then
#        echo "img_remover is already running."
#else
        echo "starting img_remover"
        forever start -l /root/.forever/img_remover.log -a cluster.js
#fi
