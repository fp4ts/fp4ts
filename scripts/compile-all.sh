proj_directory=$(PWD)


projects=(\
  "$(PWD)/packages/core/"\
  "$(PWD)/packages/cats/core/"\
  "$(PWD)/packages/cats/test-kit/"\
  "$(PWD)/packages/cats/free/"\
  "$(PWD)/packages/cats/laws/"\
  "$(PWD)/packages/cats/"\
  "$(PWD)/packages/effect/kernel/"\
  "$(PWD)/packages/effect/std/"\
  "$(PWD)/packages/effect/core/"\
  "$(PWD)/packages/effect/test-kit/"\
  "$(PWD)/packages/effect/"\
  "$(PWD)/packages/stream/core/"\
  "$(PWD)/packages/stream/test-kit/"\
  "$(PWD)/packages/stream/"\
)

for dir in ${projects[*]}; do
  cd $dir
  echo "Compiling $(PWD)"

  yarn compile
done
