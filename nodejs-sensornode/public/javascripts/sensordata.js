// AngularJS function
function ctrl_overview_sensordata($scope, $http, $timeout) 
{
	// For how long time a data frame been captured
	FRAME_FREQ_IN_MIN = 10;
	// For how many data frame been captured in one hour
	DATA_FRAME_IN_HRS = 60 / FRAME_FREQ_IN_MIN;
	// For how many data to put on the chart
	CHART_PLOT_DENSITY = 24;
	
	$scope.data = [];
	
	var plotdata = {
			type : '',
			labels : [],
			datasets : [
				{
					fillColor : "rgba(151,187,205,0.5)",
					strokeColor : "rgba(151,187,205,1)",
					pointColor : "rgba(151,187,205,1)",
					pointStrokeColor : "#fff",
					data : []
				},
			]
	}
	
	// Get history data for past 24 hours
	getHistoryData( 0, CHART_PLOT_DENSITY, DATA_FRAME_IN_HRS, '');
	  
	// Request the realtime with a timer
	$scope.onTimeout = function()
	{   
		$http(
		{
			method: 'GET', 
			url: '/getrealtimedata'
		}).
		success(function(data, status, headers, config) 
		{
			// this callback will be called asynchronously
			// when the response is available
			$scope.Time = new Date(data.Time).toLocaleString();
			$scope.Temperature = data.Temperature;
			$scope.Humidity = data.Humidity;
			$scope.Pressure = data.Pressure;
			$scope.VisibleLight = data.VisibleLight;		
			$scope.IRLight = data.IRLight;	
			$scope.UVIndex = data.UVIndex;	
		}).
		error(function(data, status, headers, config) 
		{
			// called asynchronously if an error occurs
			// or server returns response with an error status.
			console.log('AJAX GET ERROR');
		});
		
		mytimeout = $timeout($scope.onTimeout, 60000);   
	}  
	// Start the timer
	var mytimeout = $timeout($scope.onTimeout);

	/*
	*	There start with some AngularJS functions
	*/
	function getHistoryData(start, end, step, type)
	{
		// Request the history at the page loading
		$http(
		{
			method: 'GET', 
			url: '/gethistorydata',
			params: {
				start: start,
				end: end,
				step: step
			},
		}).
		success(function(data, status, headers, config) 
		{
			$scope.data = [];
			
			// this callback will be called asynchronously
			// when the response is available
			for( i = 0; i < data.length; i++ )
			{
				var obj = [];
				dateObj = new Date(data[i].Time);
				obj.Time = dateObj.toLocaleString();
				obj.Temperature = data[i].Temperature;
				obj.Humidity = data[i].Humidity;
				obj.Pressure = data[i].Pressure;
				obj.VisibleLight = data[i].VisibleLight;		
				obj.IRLight = data[i].IRLight;
				obj.UVIndex = data[i].UVIndex;
				$scope.data.push(obj);
			}
			
			// Update plot
			if( type != '' )
			{
				updateChart(step, type);
			}
		}).
		error(function(data, status, headers, config) 
		{
			// called asynchronously if an error occurs
			// or server returns response with an error status.
			console.log('AJAX GET ERROR');
		});
	}
	
	/*
	*	There start with some jQuery functions
	*/
	$("#link_chart_temp").click(function()
	{
		getHistoryData( 0, CHART_PLOT_DENSITY, DATA_FRAME_IN_HRS, 'temp');
	});
	
	$("#link_chart_humi").click(function()
	{
		getHistoryData( 0, CHART_PLOT_DENSITY, DATA_FRAME_IN_HRS, 'humi');
	});
	
	$("#link_chart_pres").click(function()
	{
		getHistoryData( 0, CHART_PLOT_DENSITY, DATA_FRAME_IN_HRS, 'pres');
	});
	
	$("#link_chart_uv").click(function()
	{
		getHistoryData( 0, CHART_PLOT_DENSITY, DATA_FRAME_IN_HRS, 'uvin');
	});
	
	$(".btn_chart_hrs").click(function()
	{
		var hrs = $(this).data('hrs');
		var step = hrs * DATA_FRAME_IN_HRS / CHART_PLOT_DENSITY;
		
		getHistoryData( 0, CHART_PLOT_DENSITY, step, plotdata.type);
	});
	
	function updateChart(step, type)
	{
		var scaleLabel = '<%=value%>';
		var hrs = step * CHART_PLOT_DENSITY / DATA_FRAME_IN_HRS;
		
		// Clean the existing data
		plotdata.labels = [];
		plotdata.datasets[0].data = [];
		
		// Push into plot
		for( i = $scope.data.length - 1; i >= 0; i-- )
		{
			dateObj = new Date($scope.data[i].Time);
			plotdata.labels.push(dateObj.Format("MM/dd, hh:mm"));
			if( type == 'temp' )
			{		
				plotdata.datasets[0].data.push($scope.data[i].Temperature);
			}
			else if( type == 'humi' )
			{
				plotdata.datasets[0].data.push($scope.data[i].Humidity);
			}
			else if( type == 'pres' )
			{
				plotdata.datasets[0].data.push($scope.data[i].Pressure);
			}
			else if( type == 'uvin' )
			{
				plotdata.datasets[0].data.push($scope.data[i].UVIndex);
			}
		}
	
		if( type == 'temp' )
		{
			plotdata.type = 'temp';
			$('#title_header_chart').text('Historical Temperature Chart (' + hrs + ' hrs)');
			scaleLabel = "<%=value%> °C";
		}
		else if( type == 'humi' )
		{
			plotdata.type = 'humi';
			$('#title_header_chart').text('Historical Humidity Chart (' + hrs + ' hrs)');
			scaleLabel = "<%=value%> %";
		}
		else if( type == 'pres' )
		{
			plotdata.type = 'pres';
			$('#title_header_chart').text('Historical Barometric Pressure Chart (' + hrs + ' hrs)');
			scaleLabel = "<%=value%> hPa";
		}
		else if( type == 'uvin' )
		{
			plotdata.type = 'uvin';
			$('#title_header_chart').text('Historical UV Index Chart (' + hrs + ' hrs)');
			scaleLabel = "<%=value%>";
		}
		
		$("#box_header_chart").show();
		
		//Get context with jQuery - using jQuery's .get() method.
		$("#chart_overview").show();
		var ctx = $("#chart_overview").get(0).getContext("2d");
		ctx.canvas.width  = window.innerWidth * 0.6;
		ctx.canvas.height  = 300;
		//This will get the first returned node in the jQuery collection.
		var myNewChart = new Chart(ctx);
		// Plot
		var options = {
			scaleLabel : scaleLabel,
			scaleFontSize : 15,
			animation: false,
			showTooltips: false,};
		new Chart(ctx).Line(plotdata, options);
	}
	
}


function ctrl_overview_hostinfo($scope, $http, $timeout) 
{	  
	// Request the realtime with a timer
	$scope.onTimeout = function()
	{   
		$http(
		{
			method: 'GET', 
			url: '/gethostinfo'
		}).
		success(function(data, status, headers, config) 
		{
			// this callback will be called asynchronously
			// when the response is available
			// DB info
			$scope.db_count = data.db_count;
			$scope.db_size = data.db_size;
			$scope.db_storageSize = data.db_storageSize;
			$scope.db_totalIndexSize = data.db_totalIndexSize;
			// CPU info
			$scope.cpu_model = data.cpu_model;
			$scope.cpu_speed = data.cpu_speed;
			cpu_total_use = data.cpu_times_user + data.cpu_times_nice + data.cpu_times_sys + data.cpu_times_idle + data.cpu_times_irq;
			$scope.cpu_times_user = ( ( data.cpu_times_user / cpu_total_use ) * 100 ).toFixed(3);
			$scope.cpu_times_nice = ( ( data.cpu_times_nice / cpu_total_use ) * 100 ).toFixed(3);
			$scope.cpu_times_sys = ( ( data.cpu_times_sys / cpu_total_use ) * 100 ).toFixed(3);
			$scope.cpu_times_idle = ( ( data.cpu_times_idle / cpu_total_use ) * 100 ).toFixed(3);
			$scope.cpu_times_irq = ( ( data.cpu_times_irq / cpu_total_use ) * 100 ).toFixed(3);
			// Sys info
			$scope.sys_uptime = ( data.sys_uptime / 3600 ).toFixed(3);
			$scope.sys_loadavg1 = ( data.sys_loadavg1 ).toFixed(3);
			$scope.sys_loadavg5 = ( data.sys_loadavg5 ).toFixed(3);
			$scope.sys_loadavg10 = ( data.sys_loadavg10 ).toFixed(3);
			$scope.sys_platform = data.sys_platform;
			$scope.sys_arch = data.sys_arch;
			$scope.sys_release = data.sys_release;
			// Mem info
			$scope.mem_free = ( data.mem_free / 1024000 ).toFixed(3);
			$scope.mem_total = ( data.mem_total / 1024000 ).toFixed(3);
		}).
		error(function(data, status, headers, config) 
		{
			// called asynchronously if an error occurs
			// or server returns response with an error status.
			console.log('AJAX GET ERROR');
		});
		
		mytimeout = $timeout($scope.onTimeout, 60000);   
	}  
	// Start the timer
	var mytimeout = $timeout($scope.onTimeout);

	/*
	*	There start with some AngularJS functions
	*/
	
	
	/*
	*	There start with some jQuery functions
	*/
	
}



Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),  
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
