Ascii Art Graph
===============

Currently uses d3 internally for domain/range generation, but shifting to a D3 compatible interface and classes built on top of it.

Usage
-----

```javascript
var graph = new Graph.Timeseries({
    height : 20,
    width : 80,
    node : '@',
    line : '`',
    timeField : 'date',
    valueField : 'value',
    colors : ['red', 'blue']
});
graph.render({
    'timeseries-a' : [
      { value: 2, date: '2019-11-25T01:55:45.000Z' },
      { value: 5, date: '2019-11-25T01:56:45.000Z' },
      { value: 3, date: '2019-11-25T01:58:45.000Z' },
      { value: 11, date: '2019-11-25T01:59:45.000Z' }
  ],
  'timeseries-b' : [
    { value: 10, date: '2019-11-25T01:55:45.000Z' },
    { value: 8, date: '2019-11-25T01:56:45.000Z' },
    { value: 4, date: '2019-11-25T01:58:45.000Z' },
    { value: 6, date: '2019-11-25T01:59:45.000Z' }
  ]
}, function(err, result){
    //do something with the result
});
```

will render:

![multi-series](https://github.com/khrome/ascii-art-docs/raw/master/Examples/multi-series.png)

and you can get finer detail by using the `.braille()` method to use the braille charset to subgrid the individual characters.

```javascript
var graph = new Graph.Timeseries({
    height : 20,
    width : 80
});
graph.braille({
    'some-random-timeseries' : [
      { value: 2, date: '2019-11-25T01:55:45.000Z' },
      { value: 5, date: '2019-11-25T01:56:45.000Z' },
      { value: 3, date: '2019-11-25T01:58:45.000Z' },
      { value: 11, date: '2019-11-25T01:59:45.000Z' }
  ]
}, function(err, text, grid){
    //do something with the results
});
```
will render:

![simple-braille](https://github.com/khrome/ascii-art-docs/raw/master/Examples/simple-braille.png)

Experimental D3 Usage
---------------------

This is all very preliminary, so much of the axis layout and placement is only partially complete. An implementation of the existing `Graph.Timeseries` using the d3 implementation is available at `Graph.NewTimeseries` (but does not currently support braille)

```js
var d3 = Graph.d3();

var x = d3.scaleTime()
    .range([0, width])
    .domain(d3.extent(allData, function(d){ return d.date; }));

var y = d3.scaleLinear()
    .range([height, 0])
    .domain(d3.extent(allData, function(d) { return d.value; }));

var xAxis = d3.terminal.axis()
    .scale(x, y) //<- note you also have to pass the scale of the opposing axis
    .tickFormat(formatFn)
    .tickSize(10)
    .orient("bottom");

var yAxis = d3.terminal.axis()
    .scale(y, x) //<- note you also have to pass the scale of the opposing axis
    .orient("left");

var line = d3.terminal.line()
    .x(function(d){ return Math.floor(x(d.date)) })
    .y(function(d){ return Math.floor(y(d.value)) });
var marker = d3.terminal.circle()
    .x(function(d){ return Math.floor(x(d.date)) })
    .y(function(d){ return Math.floor(y(d.value)) });

var svg = d3.select("::screen::")
    .attr("width", width)
    .attr("height", height);

svg.append("g")
    .attr("class", "x axis")
    .attr("height", 10)
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .attr("width", 20)
    .call(yAxis);

Object.keys(series).forEach(function(seriesName, i){
    var data = series[seriesName];
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr('color', colors[i%colors.length])
        .attr("d", line);

    svg.append("circle")
        .datum(data)
        .attr("class", "circle")
        .attr('r', 5)
        .attr('color', colors[i%colors.length])
        .call(marker);
});

//non-standard `render` function
svg.render(function(err, rendered){
    if(err) console.log('ERR', err);
    callback(null, rendered);
})
```

Renders:

![with-axes](https://github.com/khrome/ascii-art-docs/raw/master/Examples/graph_w_axes.png)

Roadmap
-------
- finish date axes(tick sampling)
- ensure top & right axes function correctly
- remove requirement to provide counter axis (deviation from d3 surface)
- support braille in the d3 interface
