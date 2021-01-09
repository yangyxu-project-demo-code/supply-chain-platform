var React = require('react');
var CustomerInfo = require('./CustomerInfo.js');
var CustomerSaleServices = require('./CustomerSaleServices.js');
var CustomerSaleServicesOther = require('./CustomerSaleServicesOther.js');
var CustomerSaleDetails = require('./CustomerSaleDetails.js');
var CustomerQuote = require('./CustomerProductQuote.js');
var CustomerOrderDetails = require('./CustomerOrderDetails.js');
var CustomerOrderWFInstance = require('./CustomerOrderWFInstance.js');
var CustomerInvoice = require('./CustomerInvoice.js');
var CustomerInvoices = require('./CustomerInvoices.js');

module.exports = React.createClass({
	getInitialState: function() {
    	return {
			view: CustomerInfo,
			info: null,
			toolbarItems: [
				{ text: '开具发票', name: 'create_invoice', icon: 'fa-plus', status: 'warning' }
			]
		};
  	},
	componentDidMount: function (){
		this.__loadInfo(this.props.request.search.znid);
	},
	componentWillReceiveProps: function (nextProps){
		if(nextProps.request.search.znid != this.props.request.search.znid){
			this.__loadInfo(nextProps.request.search.znid);
		}
	},
	__loadInfo: function (znid){
		zn.http.post('/zn.plugin.admin/model/selectOne', {
			model: 'ChunRuiOACustomer',
			where: { zn_id: znid }
		}).then(function (data){
			if(data.status==200){
				this.setState({ info: data.result });
			}
		}.bind(this), function (){

		});
	},
	__onToolbarClick: function (item){
		switch (item.name) {
			case 'create_invoice':
				zn.dialog({
					title: "开具发票",
					content: <CustomerInvoice customer={this.state.info.id} />
				});
				break;
		}
	},
	render: function(){
		return (
			<zn.react.Page
				title={this.state.info?this.state.info.zn_title:"正在加载中..."}
				headerCenter={<zn.react.ListView
					className="zr-tab-ios"
					selectMode="radio"
					valueKey="view"
					onClick={(data)=>this.setState({ view: data.value })}
					value={this.state.view}
					data={[
						{ view: CustomerInfo, text: '基础信息' },
						{ view: CustomerQuote, text: '商品报价' },
						{ view: CustomerOrderWFInstance, text: '订单流程' },
						{ view: CustomerOrderDetails, text: '订单汇总' },
						{ view: CustomerSaleDetails, text: '发货订单' },
						{ view: CustomerSaleServices, text: '售后退换货' },
						{ view: CustomerSaleServicesOther, text: '售后其他' },
						{ view: CustomerInvoices, text: '已开发票' }
					]} />}
				toolbarItems={this.state.toolbarItems}
				onToolbarClick={this.__onToolbarClick} >
				{(this.state.info && this.state.view) && <this.state.view customer={this.state.info.id} znid={this.props.request.search.znid} />}
			</zn.react.Page>
		);
	}
});
