#!/bin/bash

# Retrieve the current working directory
current_dir=$(pwd)
echo -e "Creating alias to work from this directory: \e[36m$current_dir\e[0m"

# Function to be added
function_definition='

# OpenAI cli
function gpt() {
    local nvm_available=true
    if ! command -v nvm &> /dev/null; then
        nvm_available=false
    fi
    if [ $nvm_available = true ]; then
        local current_nvm_version=$(nvm current)
        if [ -f "'"$current_dir"'/.nvmrc" ]; then
            local nvmrc_version=$(cat "'"$current_dir"'/.nvmrc")
            local numbered_version=$(nvm version $nvmrc_version)
            local major_version=$(echo $numbered_version | grep -oP "^v\\K\\d+")
            local current_major_version=$(echo $current_nvm_version | grep -oP "^v\\K\\d+")
            if [ $current_major_version -lt $major_version ]; then
                local use_nvmrc_version=true
                echo -e "\e[90m[INFO] Switching to Node.js version $nvmrc_version. Once the command is finished, the current version will be restored.\e[0m"
            else
                local use_nvmrc_version=false
            fi
            if [ $use_nvmrc_version = true ]; then
                nvm use $nvmrc_version &> /dev/null
            fi
        fi
    fi
    node --env-file="'"$current_dir"'/.env.local" "'"$current_dir"'/build/index.js" "$@"
    if [ $nvm_available = true ] && [ $use_nvmrc_version = true ]; then
        nvm use $current_nvm_version &> /dev/null
    fi
}
'

# Check if the function is already in .bashrc
# if grep -q 'function gpt()' ~/.bashrc; then
#     echo "The function 'gpt' is already defined in your .bashrc file."
#     exit 0
# fi

# Ask for confirmation
read -p "Do you want to add the 'gpt' function to your .bashrc file? (y/n): " confirm
if [[ $confirm == [yY] ]]; then
    # Add the function to .bashrc
    # echo "$function_definition" >> ~/.bashrc
    echo -e "\e[32mThe 'gpt' function has been added to your .bashrc file.\e[0m"
    echo -e "Please run '\e[36msource ~/.bashrc\e[0m' to apply the changes."
else
    echo "Operation cancelled."
fi