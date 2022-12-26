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