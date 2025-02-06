## Service worker dev setup

```bash
bash -c "find . -path './dist' -prune -o -name '*.js' -o -name '*.svelte' | entr -c ./build_and_preview.sh"
```

## Images

- Cache them from remote host and save them in sw
- Cache them from remote host, but change url so that it serves from "same-host"
  - Would allow js to get image data
