import os

print("<<< Starting to compile 'main.ts'...")
os.system("tsc main.ts")
print("\t>>> Finished compiling!")

print("<<< Removing first two lines from 'main.js'...")

len_lines = 0
with open("main.js", "r") as d:
    contents = d.read()

    d.seek(0)
    for i in range(0, 2, 1):
        len_lines += len(d.readline())

contents = contents[len_lines:]

with open("main.js", "w") as d:
    d.write(contents)

print("\t>>> Finished removing the first two lines from 'js/main.js'!")