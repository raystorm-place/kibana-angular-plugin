# Dev
Clear plugin cache, redeploy and restart

```bash
cd kibana
rm -rf ./optimize/*
cp -R ~/tmp/kibana-angular-plugin ./src/plugins/
bin/kibana
```

## Debug scope

1. Open Firebug
2. Select HTML
3. Enter `angular.element($0).scope()` in console