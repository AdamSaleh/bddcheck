# bddcheck
Simple tool for checking completness of bdd test plans

It creates a tree out of yout bdd scenarios and checks if all of the conditions specified in `Given` clauses ca be found as results of another scenario.

This ensures that your test plan is consistent and complete.

Install with npm. Usage:

```
$ bddcheck examples/missingscenario.gherkin
Checking examples/missingscenario.gherkin :
No scenario found that results in satisfying:
         "application <app> exists" on line 17
```

```
$ bddcheck examples/example.gherkin         
Checking examples/example.gherkin :
No problems found.
```


