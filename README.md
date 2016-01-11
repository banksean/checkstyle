# checkstyle
A very opinionated style checker for Polymer html files.

```
git clone https://github.com/banksean/checkstyle.git
cd checkstyle
npm install
```

Then invoke it like so:
```
./checkstyle -i somefile.html
```

And it prints out whatever style violations it finds.

Does not traverse imports. Only works on the specified input file(s).

Checks for:
- inline styles
- single-quoted html attributes
- dom-if usage
