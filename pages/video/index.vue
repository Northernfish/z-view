<style>
  .swiper {
    height: 100vh;
  }
  .text-pink {
    color: #ff80ab;
  }
  .bg-pink {
    background-color: #ff80ab;
  }
</style>

<template>
  <view class="index">
    <wuc-tab :tab-list="tabList" :tabCur.sync="currentTab" tab-class="text-center text-white bg-pink" select-class="text-white"></wuc-tab>
    <swiper :current="currentTab" class="swiper row" duration="300" :circular="true" indicator-color="rgba(255,255,255,0)" indicator-active-color="rgba(255,255,255,0)" @change="onTabChange">
      <swiper-item v-for="(item,index) in tabList" :key="index">
        <view class="card swiper-item">
          <template v-if="currentTab === index">
            <video
              v-if="info"
              id="video"
              class="card-video"
              :src="info.fileUrl"
              :title="info.name"
              autoplay
              show-mute-btn
              enable-play-gesture
              @error="onVideoError"
              @ended="onVideoEnded"
              @loadedmetadata="onVideoLoaded"
            ></video>
          </template>
        </view>
      </swiper-item>
    </swiper>
    <uni-fab
      :pattern="fabPattern"
      :content="fabContent"
      direction="vertical"
      @trigger="fabTrigger"
    ></uni-fab> 
  </view>
</template>

<script>
  import uniFab from '@/components/uni-fab/uni-fab.vue'
  import WucTab from '@/components/wuc-tab/wuc-tab.vue'
  
  export default {
    components: {
      uniFab,
      WucTab
    },
    data () {
      return {
        info: null,
        // 动画
        animation: null,
        // 渐隐渐显动画
        fadeAnimation: {},
        // 当前tab项索引
        currentTab: 0,
        // 选项卡列表
        tabList: [],
        // 标识列表
        flagMap: {},
        fabPattern: {
          color: 'rgba(255, 255, 255, 1)',
          selectedColor: '#007AFF',
          backgroundColor: 'rgba(0, 0, 0, .4)',
          buttonColor: 'rgba(0, 0, 0, .4)'
        },
        videoContext: null
      }
    },
    computed: {
      fabContent () {
        let _t = this
        // 悬浮按钮
        return [
          {
            name: 'next',
            text: '下一个',
            iconPath: require('@/static/next.png'),
            active: false
          }
        ]
      }
    },
    methods: {
      async init () {
        let _t = this
        await _t.getCategory()
        _t.handleFadeAnimation()
        _t.getInfo()
      },
      async getCategory () {
        let _t = this
        let res = await new Promise((resolve, reject) => {
          uni.request({
              url: _t.$Z.config.api + '/category/list',
              data: {
                type: 'video'
              },
              success: (res) => {
                resolve(res)
              },
              fail: (err) => {
                reject(err)
              }
          })
        })
        _t.tabList = res ? res.data.data : null
      },
      async getInfo () {
        let _t = this
        uni.showLoading({
            title: '加载中'
        })
        _t.animation.opacity(0).step()
        _t.fadeAnimation = _t.animation.export()
        let res = await new Promise((resolve, reject) => {
          uni.request({
              url: _t.$Z.config.api + '/random/video',
              data: {
                type: 'video',
                category: _t.tabList[_t.currentTab]
              },
              success: (res) => {
                resolve(res)
              },
              fail: (err) => {
                reject(err)
              }
          })
        })
        uni.hideLoading()
        console.log('getInfo done')
        _t.info = res ? res.data.data : null
        _t.$nextTick(function(){
          _t.videoContext = uni.createVideoContext('video')
          _t.animation.opacity(1).step()
          _t.fadeAnimation = _t.animation.export()
        })
      },
      handleFadeAnimation () {
        let _t = this
        let animation = uni.createAnimation({
          duration: 1000,
          timingFunction: 'ease-in-out',
        })
        _t.animation = animation
      },
      onTabChange (event) {
        let _t = this
        let { current } = event.target
        _t.currentTab = current
        _t.getInfo()
      },
      fabTrigger (data) {
        let _t = this
        let { item } = data
        switch (item.name) {
          case 'next':
            _t.getInfo()
            break
        }
      },
      onVideoError (e) {
        console.log('onVideoError', JSON.stringify(e))
      },
      onVideoEnded (e) {
        this.getInfo()
      },
      onVideoLoaded (e) {
        console.log('onVideoLoaded', JSON.stringify(e))
      }
    },
    onLoad () {
      this.init()
    },
    async onPullDownRefresh () {
      await this.getInfo()
      uni.stopPullDownRefresh()
    },
    onHide () {
      let _t = this
      console.log('hide video')
      if (_t.videoContext) {
        _t.videoContext.pause()
      }
    }
  }
</script>
