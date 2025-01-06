## Service worker dev setup

```bash
bash -c "find . -path './dist' -prune -o -name '*.js' -o -name '*.svelte' | entr -c ./build_and_preview.sh"
```
