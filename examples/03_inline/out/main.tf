terraform {
  required_version = ">=1,<2.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "2.6.1"
    }
  }
}

resource "local_file" "hello" {
  filename = "${path.module}/message.txt"
  content  = "Hello World"
}