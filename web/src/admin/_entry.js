require('../../../../../zn/zeanium-react-web/index.web.wap.js');
zn.CustomerSearcher = require('./base/CustomerSearcher.js');
zn.SupplierSearcher = require('./base/SupplierSearcher.js');

zn.react.app = zn.react.Application.create({
	plugins: [
		require('zn-plugin-admin'),
		require('zn-plugin-stock'),
		require('../../../../../zn/zn-plugin-workflow')
	],
	home: '/znpluginadmin.login',
	path: '/znpluginadmin.main',
	main: '/znpluginadmin.main/user.dashboard',
	routers: {
		'/base.defective.product.stock.page': require('./base/DefectiveProductStockPage.js'),
		'/base.customer.invoices': require('./base/CustomerInvoices.js'),
		'/workorder.allocate.ticket': require('./workorder/AllocateTicket.js'),
		'/workorder.in.ticket': require('./workorder/InTicket.js'),
		'/workorder.in.ticket.detail.list': require('./workorder/InTicketDetailList.js'),
		'/workorder.in.ticket.detail.search': require('./workorder/InTicketDetailSearch.js'),
		'/workorder.out.ticket': require('./workorder/OutTicket.js'),
		'/workorder.sale.ticket': require('./workorder/SaleTicket.js'),
		'/workorder.sale.service.ticket': require('./workorder/SaleServiceTicket.js'),
		'/workorder.sale.service.ticket.detail.list': require('./workorder/SaleServiceTicketDetailList.js'),
		'/workorder.sale.service.other.ticket': require('./workorder/SaleServiceOtherTicket.js'),
		'/workorder.sale.service.other.ticket.detail.list': require('./workorder/SaleServiceOtherTicketDetailList.js'),
		'/workorder.sale.ticket.detail.list': require('./workorder/SaleTicketDetailList.js'),
		'/workorder.sale.ticket.detail.search': require('./workorder/SaleTicketDetailSearch.js'),
		'/workorder.create.allocate.ticket': require('./workorder/CreateAllocateTicket.js'),
		'/workorder.create.sale.ticket': require('./workorder/CreateSaleTicket.js'),
		'/workorder.create.in.ticket': require('./workorder/CreateInTicket.js'),
		'/workorder.create.service': require('./workorder/CreateService.js'),
		'/user.dashboard': require('./user/Dashboard.js'),
		'/user.customer': require('./user/Customer.js'),
		'/user.customer.center': require('./user/Customer.Center.js'),
		'/user.customer.order.wfinstance.page': require('./user/CustomerOrderWFInstancePage.js'),
		'/user.customer.order.details.page': require('./user/CustomerOrderDetailsPage.js'),
		'/user.customer.bill': require('./user/CustomerBill.js'),
		'/user.supplier': require('./user/Supplier.js'),
		'/user.supplier.center': require('./user/Supplier.Center.js'),
		'/user.supplier.order.wfinstance.page': require('./user/SupplierOrderWFInstancePage.js'),
		'/user.supplier.order.details.page': require('./user/SupplierOrderDetailsPage.js'),
		'/user.test': require('./user/Test.js')
	}
});
