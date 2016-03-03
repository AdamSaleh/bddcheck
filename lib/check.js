var R = require('ramda');
var intersects = require('./intersect.js');
var fs = require('fs');
var gherkin = require('gherkin');
var kasai = require('kasai')
var match = kasai.match;
var $ = kasai.$;


var modifyText = R.pipe(R.trim,R.replace(/<\w*>/,"*"));

var modify = R.pipe(
    //R.map(R.pick(['name','steps'])),
    R.map(R.assoc('unapplied',true)),
    R.map( //for all scenrios
        R.over(R.lensProp('steps'), //modify steps property
          R.pipe(
            R.reduce(function (acc, step) {
              return match(step, [
                [{keyword:function (x) {return 'And' === R.trim(x)}, text:$, location: $}, function (t,l) {
                    var nxt = R.append({'text':modifyText(t), 'original': R.trim(t), 'location':l},acc[acc['last']]);
                    return R.assoc(acc.last,nxt,acc);
                }],
                [{keyword:$, text:$, location: $}, function (k,t,l) {
                    var tk = R.trim(k);
                    acc['last'] = tk;
                    acc[tk] = [{'text':modifyText(t), 'original': R.trim(t), 'location':l}];
                    return acc;
                }]
              ])
            },{'last':'None'}),
            R.omit('last'),
            R.ifElse(R.has('Given'),
              R.over(R.lensProp('Given'),R.map(R.assoc('reachable',false))),
              R.identity)
          )
        ) 
      )
    );

//if 

var reachability = function (x) {
    var r = !R.has('Given',x.steps) || R.all(R.identity,R.map(R.prop('reachable'),x.steps['Given']));
    return r;
}

var reachable = R.allPass([reachability,R.prop('unapplied')]);
var toBeApplied = R.pipe(
    R.filter(reachable),
    R.map(R.path(['steps','Then'])),
    R.flatten);

var unreachable = R.pipe(
    R.filter(R.complement(reachability)),
    R.map(R.path(['steps','Given'])),
    R.flatten,
    R.filter(function (x) {return x.reachable === false}));

var markUnaplied = R.map(R.ifElse(reachable,R.assoc('unapplied',false),R.identity))

var applyThenClause = function(scenario,then) {
    
    return R.over(R.lensProp('steps'),R.over(R.lensProp('Given'), R.map(function (condition){
        if(intersects(then.text,condition.text).isGood){
           return R.set(R.lensProp('reachable'),true,condition);
        }

        return condition;
    })),scenario);
    
}

var applyThenClauses = R.flip(R.reduce(applyThenClause))

var step = function(scenarios) {
    var thenClauses = toBeApplied(scenarios);

    return R.map(R.unless(R.complement(R.prop('unapplied')),applyThenClauses(thenClauses)),
                 markUnaplied(scenarios));
}

function checkScenarios(scenario){
    var sc = scenario;
    while(R.length(toBeApplied(sc))>0){
        sc = step(sc);
    }
    return sc;
}

function parseGherkin(str){
  var parser = new gherkin.Parser();
  return parser.parse(str).scenarioDefinitions;
}

var checkString = R.pipe(parseGherkin,modify,checkScenarios,unreachable);

function checkFile (fname,cb){
  fs.readFile(fname, 'utf8', function (err,data) {
    if (err) {
      return cb(err);
    }
    
    return cb(null,checkString(data));
  });
}

module.exports = {
  checkString: checkString,
  checkFile: checkFile
}



