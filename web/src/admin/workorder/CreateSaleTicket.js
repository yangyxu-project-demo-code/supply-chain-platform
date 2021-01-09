var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			indexId: 11,
			customer: null,
			customer_title: null
		};
	},
	__onPrimaryFormChange: function (value, input, form){
		if(input.props.name == 'customer') {
			this.state.customer = value.item.id;
			this.state.customer_title = value.item.zn_title;
			zn.http.post('/oa/customer/getQuotes', {
				customer: this.state.customer
			}).then(function (data){
				if(data.status==200){
					var _temp = {};
					data.result.forEach(function (item){
						_temp[item.product_model] = item.price;
					});
					if(this.state.prices){
						zn.notification.warning('您已切换客户, 必须重新导入商品列表表格!!!');
					}
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
		if(!this.state.customer){
			return zn.notification.error('请先选择客户'), false;
		}
		var item = null;
		for(var i = 0, _len = data.length; i<_len; i++){
			item = data[i];
			if(!item.out_warehouse){
				return zn.notification.error('未选择出库仓'), false;
			}
			if(!item.product_model){
				return zn.notification.error('未选择商品型号'), false;
			}
			if(!item.count){
				return zn.notification.error('未选择商品数量'), false;
			}
			item.price = item.price || this.state.prices[item.product_model];
			item.total_sum = ((item.count||0) * (item.price||0)).toFixed(2);
			item.customer_id = this.state.customer;
			item.customer = this.state.customer_title;
		}
	},
	__onRowColumnChange: function (row, column, value, data, props){
		if(!this.state.prices){
			zn.notification.warning('请先选择客户, 会自动匹配商品报价.');
		}
		if(props.name == 'product_model' && this.state.prices){
			data.price = this.state.prices[value] || 0;
			data.total_sum = ((data.count||0) * (data.price||0)).toFixed(2);
			data.customer_id = this.state.customer;
			data.customer = this.state.customer_title;
		}
	},
	__onTableUploadComplete: function(data, uploader, table, instance){
		//return;
		if(!this.state.customer) {
			zn.notification.warning('请先选择客户, 会自动匹配商品报价.');
		}
		zn.preloader.open({
			title:'余额验证中...'
		})
		zn.http.post('/oa/customer/getAccount', {
			customer: this.state.customer
		}).then(function (response){
			zn.preloader.close();
			if(response.status==200){
				var _values = data[0].values,
					_sum = 0;
				_values.map(function (value){
					_sum += (+value.price) * (+value.count);
				});
				//console.log(response.result[0].account, _sum);
				if(response.result[0].account < _sum){
					zn.notification.error("❌余额不足: 系统剩余余额(" + response.result[0].account + "), 当前总额(" + _sum + ")");
					instance.setState({
						canSubmit: false
					});
				}else{
					zn.notification.success("✅余额验证成功: 系统剩余余额(" + response.result[0].account + "), 当前总额(" + _sum + ")");
					instance.setState({
						canSubmit: true
					});
				}
			}else {
				zn.notification.error(data.result);
			}
		}.bind(this), function (error){
			zn.notification.error('加载失败');
			zn.preloader.close();
		});
	},
	render:function(){
		return (
			<zn.react.Page title='创建销售制单流程' >
				<zn.plugin.workflow.CreateInstance 
					id={this.state.indexId} 
					style={{ backgroundColor: '#FFF' }} 
					onRowColumnChange={this.__onRowColumnChange} 
					onDeputyValidate={this.__onDeputyValidate} 
					onPrimaryFormChange={this.__onPrimaryFormChange} 
					onTableUploadComplete={this.__onTableUploadComplete}
					onCreateSuccess={this.__onCreateSuccess} />
			</zn.react.Page>
		);
	}
});
