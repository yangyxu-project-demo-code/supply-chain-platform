var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			indexId: 14,
			supplier: null
		};
	},
	__onPrimaryFormChange: function (value, input, form){
		if(input.props.name == 'supplier') {
			this.state.supplier = value.value;
			zn.http.post('/oa/supplier/getQuotes', {
				supplier: this.state.supplier
			}).then(function (data){
				if(data.status==200){
					var _temp = {};
					data.result.forEach(function (item){
						_temp[item.product_model] = item.price;
					});
					this.state.prices = _temp;
				}else {
					zn.notification.error(data.result);
				}
			}.bind(this), function (error){
				zn.notification.error('加载失败');
			});
		}
	},
	__onDeputyValidate: function (data){
		if(!this.state.supplier){
			return zn.notification.error('请先选择客户'), false;
		}
		data.forEach(function (item){
			item.price = item.price || this.state.prices[item.product_model];
			item.amount = (item.count||0) * (item.price||0);
		}.bind(this));
	},
	render:function(){
		return (
			<zn.react.Page title='创建仓库调拨流程' >
				<zn.plugin.workflow.CreateInstance style={{ backgroundColor: '#FFF' }} onDeputyValidate={this.__onDeputyValidate} onPrimaryFormChange={this.__onPrimaryFormChange} id={this.state.indexId} onCreateSuccess={this.__onCreateSuccess} />
			</zn.react.Page>
		);
	}
});
