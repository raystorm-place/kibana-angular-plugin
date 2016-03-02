# Kibana Gravity
Gravity integration into kibana

# Compatibility
* kibana (=4.4.1)

# Dev
Clear plugin cache, redeploy and restart

```bash
cd kibana
rm -rf ./optimize/*
cp -R ~/tmp/kibana-gravity ./src/plugins/
bin/kibana
```


# Reference
- https://www.timroes.de/2015/12/02/writing-kibana-4-plugins-basics/
- https://www.timroes.de/2015/12/02/writing-kibana-4-plugins-simple-visualizations/
- https://www.timroes.de/2015/12/06/writing-kibana-4-plugins-visualizations-using-data/