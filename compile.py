import os

print("<<< Starting to compile 'ts/main.ts'...")
os.system("tsc ts/main.ts")
print("\t>>> Finished compiling!")

print("<<< copying 'ts/main.js' to 'js/main.js'...")
os.system("cp ts/main.js js/main.js")
print("\t>>> Finished copying!")

print("<<< Deleting 'ts/main.js'...")
os.system("rm ts/main.js")
print("\t>>> Finished deleting!")

print("<<< Removing first two lines from 'js/main.js'...")

len_lines = 0
with open("js/main.js", "r") as d:
    contents = d.read()

    d.seek(0)
    for i in range(0, 2, 1):
        len_lines += len(d.readline())

contents = contents[len_lines:]

with open("js/main.js", "w") as d:
    d.write(contents)

print("\t>>> Finished removing the first two lines from 'js/main.js'!")