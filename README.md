# Kibana Angular
Display documents in angular syntax with the Angular Widget Plugin for Kibana.
Bootstrap 3 is supported.

# Install

```bash
bin/kibana plugin -i kibana-angular-plugin -u https://github.com/raystorm-place/kibana-angular-plugin/releases/download/v0.0.2/kibana-angular-plugin-v0.0.2.tar.gz
```

# Example

Render docs with angular
```html
<div class="panel-heading" id="doc-{{$index}}">
	<div class="row">
		<div class="col-md-3">
			<img src="{{doc.fields.image}}" class="img-responsive" alt="thumbnail" />
		</div>
		<div class="col-md-7">
			<a href="{{doc.fields.url}}" class="panel-title" style="color: #298fa3">
				{{doc.fields.title}}
			</a>
		</div>
	</div>
</div>
```

# Compatibility
Plugins are officialy not supported, because of fast code changes even in minor Versions.

The plugin is compatible with following Versions (other not tested yet):
* kibana (=4.x)

