let wishlist = document.getElementById('wishlist-icon')
        let cart = document.getElementById('cart-icon')
        let userName = document.getElementById('userName')
        let loginDropdown = document.getElementById('loginDropdown')
        let logoutDropdown = document.getElementById('logoutDropdown')
        
        $.ajax({
                url:'/wishlistAndCartCount',                
                method:'post',
                success:(response)=>{
                   wishlist.innerText = response?.wishlistCount||0
                   cart.innerText = response?.cartCount||0
                   userName.innerText = response?.userName||"Guest User"

                   if(response?.userName)return loginDropdown.style.display = "none";
                    logoutDropdown.style.display = "none";
                   
                }
            })