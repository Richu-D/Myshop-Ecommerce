    let wishlist = document.getElementById('wishlist-icon')
    let cart = document.getElementById('cart-icon')
    let userName = document.getElementById('userName')
    let loginDropdown = document.getElementById('loginDropdown')
    let logoutDropdown = document.getElementById('logoutDropdown')

    $.ajax({
    url:'/wishlistAndCartCount',                
    method:'post',
    success:(response)=>{
        wishlist.innerText = response?.wishlistCountAndCartCount?.wishlistCount||0
        cart.innerText = response?.wishlistCountAndCartCount?.cartCount||0
        userName.innerText = response?.wishlistCountAndCartCount?.userName||"Guest User"      




    if(response?.wishlistCountAndCartCount?.userName)return loginDropdown.style.display = "none";
    logoutDropdown.style.display = "none";
    }
    })


    $.ajax({
        url:'/getCategory',                
        method:'post',
        success:(response)=>{          
    
        for (var i = 0; i < response?.category?.length; ++i) {
        $('#categoryDropdown').append(`
            <form action="/search" method="get">
            <input type="text" name="searchKey" value="${response?.category[i].category}" style="display:none;">
            <button  type="submit" class="dropdown-item">${response?.category[i].category}</button></form>
        `);
        }
    
    
        }
        })
